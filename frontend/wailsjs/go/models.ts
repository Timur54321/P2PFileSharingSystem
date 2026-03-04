export namespace main {
	
	export class FileInfo {
	    filename: string;
	    size: number;
	    sizeFormatted: string;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filename = source["filename"];
	        this.size = source["size"];
	        this.sizeFormatted = source["sizeFormatted"];
	        this.path = source["path"];
	    }
	}
	export class RegisteredFile {
	    fileID: string;
	    filename: string;
	    size: number;
	    size_formatted: string;
	
	    static createFrom(source: any = {}) {
	        return new RegisteredFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileID = source["fileID"];
	        this.filename = source["filename"];
	        this.size = source["size"];
	        this.size_formatted = source["size_formatted"];
	    }
	}

}

