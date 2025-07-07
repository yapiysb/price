// Google Drive API servisi
const GOOGLE_DRIVE_API_KEY = "AIzaSyCWkDG-Ap9kuKetD4wKXL0rBSTxkSSZCA0"; // Bu kısmı Google Cloud Console'dan alacağınız API key ile değiştirin
const FOLDER_ID = '1T_ahaYDTMRof2SZgzJPaV0BiRQQRpi2f';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService;
  private apiKey: string;

  private constructor() {
    this.apiKey = GOOGLE_DRIVE_API_KEY;
  }

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  async getFilesFromFolder(): Promise<DriveFile[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${this.apiKey}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink)`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // PDF, Excel dosyalarını ve klasörleri filtrele
      const supportedFiles = data.files.filter((file: DriveFile) => 
        file.mimeType === 'application/pdf' ||
        file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimeType === 'application/vnd.ms-excel' ||
        file.mimeType === 'application/vnd.google-apps.folder'
      );

      return supportedFiles;
    } catch (error) {
      console.error('Google Drive API hatası:', error);
      throw error;
    }
  }

  getFileViewUrl(fileId: string, mimeType: string): string {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return `https://drive.google.com/drive/folders/${fileId}`;
    } else if (mimeType === 'application/pdf') {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    } else {
      // Excel dosyaları için Google Sheets viewer
      return `https://docs.google.com/spreadsheets/d/${fileId}/edit?usp=sharing`;
    }
  }

  getFileDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
}