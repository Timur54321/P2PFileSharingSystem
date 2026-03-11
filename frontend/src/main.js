import './style.css';
import './app.css';

window.runtime.EventsOn("download_progress", progress => {
    const bar = document.querySelector("#progress");
    bar.style.width = progress+"%";
});

const initClient = async function() {
    document.querySelector("#createFile").addEventListener("click", async () => {
        const fileInfo = await window.go.main.App.UploadFile();
        alert("fileUplaoded")
    });

    const myName = await window.go.main.App.GetMyName();
    
    document.querySelector("#fileNetwork").addEventListener("click", getAndShowFilesForSale);
    document.querySelector("#myFiles").addEventListener("click", printMyFiles)
}

async function purchaseFile() {
    
}

async function printMyFiles() {
    const result = await window.go.main.App.GetMyFiles();

    const listBox = document.querySelector(".filesListBox");
    listBox.innerHTML = "";

    result.forEach(el => {
        let fileType = getFileType(el.filename);
        listBox.insertAdjacentHTML('beforeend', `
            <div class="fileListItem">
                <img src="./src/assets/images/${fileType}.png" alt="" class="iconSize">
                <div>
                    <h1 class="regularText fileListName">${el.filename}</h1>
                </div>
                <h1 class="regularText">${el.sizeFormatted}</h1>
                <h1 class="fileListStatus regularText">Публичный</h1>
                <h1 class="regularText">${el.fileID}</h1>
                <img src="./src/assets/images/download-to-storage-drive.png" alt="" class="downloadIcon">
            </div>
            `)
    });
}

const getAndShowFilesForSale = async function() {
    const files = await window.go.main.App.GetFilesForSale();
    
    document.querySelector(".filesListBox").innerHTML = "";
    files.forEach(element => {
        let fileType = getFileType(element.filename);
        document.querySelector(".filesListBox").insertAdjacentHTML('beforeend', 
            `
            <div class="fileListItem">
                <img src="./src/assets/images/${fileType}.png" alt="" class="iconSize">
                <div>
                    <h1 class="regularText fileListName">${element.filename}</h1>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <p class="fileOwnerID notReallyWhite">${element.owner_id}</p>
                        <img src="./src/assets/images/user.png" alt="" class="fileOwnerIcon notReallyWhiteImage">
                    </div>
                </div>
                <h1 class="regularText">${element.size_formatted}</h1>
                <h1 class="fileListStatus regularText">Публичный</h1>
                <h1 class="regularText">${element.fileID}</h1>
                <img src="./src/assets/images/download-to-storage-drive.png" alt="" class="downloadIcon downloadFile" data-fileid="${element.fileID}" data-owner="${element.owner_id}">
            </div>
            <div class="interLine"></div>
            `
        )
    });

    document.querySelectorAll(".downloadFile").forEach(el => {
        el.addEventListener("click", async function() {
            const result = await window.go.main.App.BuyFile(this.dataset.owner, this.dataset.fileid);

            if (result == "success") {
                alert("Файл был жестоко получен");
            } else {
                alert("Что пошло не по предвиденному сценарию");
            }
        })
    });
}

window.addEventListener("load", initClient)

window.runtime.EventsOn('file-download-progress', (progress) => {
    console.log('Прогресс:', progress);
    
    // Обновляем UI
    updateProgressUI(progress);
});

function updateProgressUI(progress) {
    const percent = progress.Percent.toFixed(1);
    const receivedMB = (progress.BytesReceived / 1024 / 1024).toFixed(2);
    const totalMB = (progress.TotalSize / 1024 / 1024).toFixed(2);
    
    // Скорость в человекочитаемом формате
    let speedText = '';
    if (progress.Speed) {
        if (progress.Speed > 1024 * 1024) {
            speedText = `${(progress.Speed / 1024 / 1024).toFixed(2)} MB/s`;
        } else if (progress.Speed > 1024) {
            speedText = `${(progress.Speed / 1024).toFixed(2)} KB/s`;
        } else {
            speedText = `${progress.Speed.toFixed(0)} B/s`;
        }
    }
    
    // Обновляем элементы на странице
    document.getElementById('progress-bar').style.width = `${percent}%`;
    document.getElementById('progress-text').innerHTML = 
        `${percent}% (${receivedMB} MB / ${totalMB} MB) ${speedText}`;
}

function getFileType(filename) {
    // Проверка, что filename является строкой
    if (typeof filename !== 'string' || filename.length === 0) {
        return "regularFile";
    }

    // Получаем расширение файла (часть после последней точки)
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    // Словари с расширениями для разных типов
    const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'tif', 'raw'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'ape', 'mid', 'midi'];

    // Определяем тип файла
    if (videoExtensions.includes(extension)) {
        return "videoType";
    } else if (imageExtensions.includes(extension)) {
        return "imageType";
    } else if (audioExtensions.includes(extension)) {
        return "audioType";
    } else {
        return "regularFile";
    }
}