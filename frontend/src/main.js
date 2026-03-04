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
        const result = await window.go.main.App.BuyFile();
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
                    <h3>${element.sizeFormatted}</h3>
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