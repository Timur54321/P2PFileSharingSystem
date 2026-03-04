package main

import (
	"bufio"
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multiaddr"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

const RELAY_ADDR = "/ip4/178.72.155.3/tcp/37745/p2p/QmfH8qgARV5ANE5LjpPo9YujKgdabtfgL4uuWneKxv7pYd"
const RegisterFileProtocolID = "/register_file/1.0.0"
const FilesForSaleProtocolID = "/files_for_sale/1.0.0"
const FileWaitSignal = "/waitForSignalToTransmitFile/1.0.0"
const BuyFileProtocolID = "/buyFile/1.0.0"
const transmitProtocolID = "/transmitFile/1.0.0"

var stablePeerId *peer.AddrInfo
var mySale FileInfo

type RegisteredFile struct {
	ID            string `json:"fileID"`
	Name          string `json:"filename"`
	Size          int64  `json:"size"`
	SizeFormatted string `json:"size_formatted"`
}

type FileInfo struct {
	Name          string `json:"filename"`
	Size          int64  `json:"size"`
	SizeFormatted string `json:"sizeFormatted"`
	Path          string `json:"path"`
}

func initGui(h host.Host) {
	fmt.Println("I am " + fmt.Sprintf("%s", h.ID()))
	// Create an instance of the app structure
	app := NewApp(h)

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "fileSharingSystem",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

func getStablePeerId(h host.Host) {
	maddr, err := multiaddr.NewMultiaddr(RELAY_ADDR)
	if err != nil {
		log.Println(err)
		return
	}

	peerId, err := peer.AddrInfoFromP2pAddr(maddr)
	if err != nil {
		log.Println(err)
		return
	}

	stablePeerId = peerId

	err = h.Connect(context.Background(), *stablePeerId)
	if err != nil {
		log.Fatal(err)
	}

	s, err := h.NewStream(context.Background(), stablePeerId.ID, FileWaitSignal)
	if err != nil {
		log.Println(err)
	}

	go waitingForTransmition(s, h)
}

func waitingForTransmition(s network.Stream, h host.Host) {
	defer s.Close()
	decoder := json.NewDecoder(s)
	var fileId string

	for {
		err := decoder.Decode(&fileId)
		if err != nil {
			log.Println(err)
			break
		}

		newStream, err := h.NewStream(context.Background(), stablePeerId.ID)
		writer := bufio.NewWriter(newStream)

		file, err := os.Open(mySale.Path)
		if err != nil {
			fmt.Println("Ошибка открытия файла: ", err)
			continue
		}

		info, err := file.Stat()
		if err != nil {
			fmt.Println("Ошибка получения размера: ", err)
			file.Close()
			newStream.Close()
			continue
		}

		filename := filepath.Base(mySale.Path)
		filesize := info.Size()

		writer.WriteString(filename + "\n")
		writer.WriteString(fmt.Sprintf("%d\n", filesize))

		writer.Flush()

		_, err = io.CopyN(writer, file, filesize)
		if err != nil {
			fmt.Println("Ошибка отправки файла: ", err)
			file.Close()
			newStream.Close()
			continue
		}

		writer.Flush()
		file.Close()

		fmt.Println("Файл отправлен:", filename)
		newStream.Close()
	}
}

func main() {
	h, err := libp2p.New(
		libp2p.ListenAddrStrings("/ip4/0.0.0.0/tcp/9000"),
	)

	getStablePeerId(h)

	if err != nil {
		log.Println(err)
		return
	}

	initGui(h)
}

func (a *App) UploadFile() (*FileInfo, error) {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Выберите файл для загрузки",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Все файлы",
				Pattern:     "*.*",
			},
			{
				DisplayName: "Изображения",
				Pattern:     "*.txt;*.doc;*.docx",
			},
			{
				DisplayName: "Текстовые файлы",
				Pattern:     "*.txt;*.doc;*.docx",
			},
		},
	})

	if err != nil {
		return nil, err
	}

	if filePath == "" {
		return nil, nil
	}

	fileInfo, err := os.Stat(filePath)
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		absPath = filePath
	}

	fileId := GenerateFileID()
	data := RegisteredFile{
		ID:            fileId,
		Name:          fileInfo.Name(),
		Size:          fileInfo.Size(),
		SizeFormatted: formatFileSize(fileInfo.Size()),
	}

	s, err := a.host.NewStream(context.Background(), stablePeerId.ID, RegisterFileProtocolID)
	if err != nil {
		log.Println(err)
		return nil, err
	}
	defer s.Close()

	fmt.Println("SOmething supposed to happen")
	encoder := json.NewEncoder(s)
	err = encoder.Encode(data)
	if err != nil {
		log.Println(err)
	}

	buf := make([]byte, 2)
	s.Read(buf)
	fmt.Printf("Response: %s\n", string(buf))

	mySale = FileInfo{
		Name:          fileInfo.Name(),
		Size:          fileInfo.Size(),
		SizeFormatted: formatFileSize(fileInfo.Size()),
		Path:          absPath,
	}

	return &mySale, nil
}

func (a *App) GetFilesForSale() ([]RegisteredFile, error) {
	var filesForSale []RegisteredFile

	s, err := a.host.NewStream(context.Background(), stablePeerId.ID, FilesForSaleProtocolID)
	if err != nil {
		log.Println(err)
		return nil, err
	}
	defer s.Close()

	decoder := json.NewDecoder(s)
	err = decoder.Decode(&filesForSale)
	if err != nil {
		log.Printf("Error decoding file: %v", err)
		return nil, err
	}

	fmt.Println("Received somethin' fr")
	return filesForSale, nil
}

func (a *App) GetMyName() string {
	return a.host.ID().String()
}

func (a *App) BuyFile() {
	s, err := a.host.NewStream(context.Background(), stablePeerId.ID, BuyFileProtocolID)
	defer s.Close()

	if err != nil {
		log.Println(err)
		return
	}

	s.Write([]byte("BuyFile"))

	newStream, err := a.host.NewStream(context.Background(), stablePeerId.ID, transmitProtocolID)
	if err != nil {
		log.Println(err)
	}

	defer newStream.Close()
	reader := bufio.NewReader(s)

	filename, err := reader.ReadString('\n')
	if err != nil {
		fmt.Println("Ошибка чтения имени файла: ", err)
		return
	}
	filename = strings.TrimSpace(filename)

	sizeStr, err := reader.ReadString('\n')
	if err != nil {
		fmt.Println("Ошибка чтения размера: ", err)
		return
	}
	sizeStr = strings.TrimSpace(sizeStr)

	filesize, err := strconv.ParseInt(sizeStr, 10, 64)
	if err != nil {
		fmt.Println("Ошибка парсинга размера: ", err)
		return
	}

	out, err := os.Create("received_" + filename)
	if err != nil {
		fmt.Println("Ошибка создания файла: ", err)
		return
	}

	_, err = io.CopyN(out, reader, filesize)
	if err != nil {
		fmt.Println("Ошибка при получения файла: ", err)
		out.Close()
		return
	}

	out.Close()

	fmt.Println("\nФайл получен:", filename)
}

func formatFileSize(size int64) string {
	const unit = 1024
	if size < unit {
		return fmt.Sprintf("%d Б", size)
	}
	div, exp := int64(unit), 0
	for n := size / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cБ", float64(size)/float64(div), "KMGT"[exp])
}

func GenerateFileID() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 7)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
