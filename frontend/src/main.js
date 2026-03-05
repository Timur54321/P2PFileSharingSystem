import './style.css';
import './app.css';

const initClient = async function() {
    document.querySelector("#chooseForSale").addEventListener("click", async () => {
        const fileInfo = await window.go.main.App.UploadFile();

        document.querySelector(".files_box").insertAdjacentHTML('beforeend', 
            `
            <div class="file_block">
                <div>
                    <h3>${fileInfo.filename}</h3>
                </div>
                <div>
                    <h3>${fileInfo.sizeFormatted}</h3>
                </div>
                
                <div>
                    <h3>Продаётся</h3>
                </div>
            </div>
            `
        )
    });

    const myName = await window.go.main.App.GetMyName();
    document.querySelector("#iam").textContent = myName;
    
    document.querySelector("#whatsforsale").addEventListener("click", getAndShowFilesForSale);
    document.querySelector("#buyFile").addEventListener("click", async () => {
        document.querySelector("#gettingFileStatus").textContent = "Получаю файл... 🙄🙄 (прогресс бара пока что нет 😡😠😠)";
        const result = await window.go.main.App.BuyFile();

        if (result == "success") {
            document.querySelector("#gettingFileStatus").textContent = "Ну типа получил файл и че дальше то? 🥱🥱 (Проверь наличие файла в текущей директории может быть 🤔)";
        } else {
            document.querySelector("#gettingFileStatus").textContent = "Что-то пошло не по плану 😝😜😝";
        }
    });
}

const getAndShowFilesForSale = async function() {
    const files = await window.go.main.App.GetFilesForSale();

    files.forEach(element => {
        document.querySelector(".files_for_sale_block").insertAdjacentHTML('beforeend', 
            `
            <div class="file_block">
                <div>
                    <h3>${element.filename}</h3>
                </div>
                <div>
                    <h3>${element.size_formatted}</h3>
                </div>
                <div>
                    <h3>${element.fileID}</h3>
                </div>
                
                <div>
                    <h3>Продаётся</h3>
                </div>
            </div>
            `
        )
    });
}

window.addEventListener("load", initClient)