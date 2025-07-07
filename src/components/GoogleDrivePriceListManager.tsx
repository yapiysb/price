import React, { useState, useEffect } from 'react';
import { Search, FileText, Sheet, Download, Eye, X, RefreshCw, AlertCircle, ExternalLink, ArrowUpDown, Folder, File } from 'lucide-react';
import { GoogleDriveService, DriveFile } from '../services/googleDriveService';

interface PriceListFile {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'folder';
  size: string;
  modifiedTime: Date;
  viewUrl: string;
  downloadUrl: string;
  isFolder: boolean;
}

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

const GoogleDrivePriceListManager: React.FC = () => {
  const [files, setFiles] = useState<PriceListFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const driveService = GoogleDriveService.getInstance();

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const driveFiles = await driveService.getFilesFromFolder();
      
      const processedFiles: PriceListFile[] = driveFiles.map((file: DriveFile) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        let fileType: 'pdf' | 'excel' | 'folder' = 'folder';
        
        if (!isFolder) {
          fileType = file.mimeType === 'application/pdf' ? 'pdf' : 'excel';
        }

        return {
          id: file.id,
          name: file.name,
          type: fileType,
          size: file.size ? formatFileSize(parseInt(file.size)) : isFolder ? '-' : 'Bilinmiyor',
          modifiedTime: new Date(file.modifiedTime),
          viewUrl: driveService.getFileViewUrl(file.id, file.mimeType),
          downloadUrl: driveService.getFileDownloadUrl(file.id),
          isFolder
        };
      });

      setFiles(processedFiles);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Dosyalar yüklenirken hata oluştu. Lütfen API anahtarınızı kontrol edin.');
      console.error('Dosya yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const sortFiles = (files: PriceListFile[], sortOption: SortOption): PriceListFile[] => {
    return [...files].sort((a, b) => {
      // Klasörleri her zaman üstte göster
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'tr');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'tr');
        case 'date-asc':
          return a.modifiedTime.getTime() - b.modifiedTime.getTime();
        case 'date-desc':
          return b.modifiedTime.getTime() - a.modifiedTime.getTime();
        default:
          return 0;
      }
    });
  };

  const filteredAndSortedFiles = sortFiles(
    files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }),
    sortOption
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openFileInNewTab = (file: PriceListFile) => {
    if (file.isFolder) {
      window.open(`https://drive.google.com/drive/folders/${file.id}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open(file.viewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getFileIcon = (file: PriceListFile) => {
    if (file.isFolder) {
      return <Folder className="h-8 w-8 text-blue-500 mr-3" />;
    }
    
    switch (file.type) {
      case 'pdf':
        return (
          <div className="h-8 w-8 mr-3 flex items-center justify-center bg-red-100 rounded text-red-600 text-xs font-bold">
            PDF
          </div>
        );
      case 'excel':
        return (
          <div className="h-8 w-8 mr-3 flex items-center justify-center bg-green-100 rounded text-green-600 text-xs font-bold">
            XLS
          </div>
        );
      default:
        return <File className="h-8 w-8 text-gray-500 mr-3" />;
    }
  };

  const getFileTypeStats = () => {
    const stats = {
      folders: files.filter(f => f.isFolder).length,
      pdfs: files.filter(f => f.type === 'pdf').length,
      excels: files.filter(f => f.type === 'excel').length
    };
    return stats;
  };

  const stats = getFileTypeStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Fiyat Listeleri Yükleniyor</h3>
          <p className="text-gray-600">Google Drive'dan dosyalar getiriliyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Hata Oluştu</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Not:</strong> Google Drive API kullanmak için:
              <br />1. Google Cloud Console'da proje oluşturun
              <br />2. Drive API'yi etkinleştirin
              <br />3. API anahtarını src/services/googleDriveService.ts dosyasına ekleyin
            </p>
          </div>
          <button
            onClick={loadFiles}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Fiyat Listeleri</h1>
              <p className="text-gray-600">
                {lastUpdate ? `Son güncellenme: ${formatDate(lastUpdate)}` : 'Yükleniyor...'}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={loadFiles}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </button>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.folders}</div>
                  <div className="text-sm text-gray-500">Klasör</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.pdfs}</div>
                  <div className="text-sm text-gray-500">PDF</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.excels}</div>
                  <div className="text-sm text-gray-500">Excel</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Dosya ve klasörlerde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-gray-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                >
                  <option value="name-asc">Ada Göre (A-Z)</option>
                  <option value="name-desc">Ada Göre (Z-A)</option>
                  <option value="date-asc">Tarihe Göre (Eskiden Yeniye)</option>
                  <option value="date-desc">Tarihe Göre (Yeniden Eskiye)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedFiles.map((file) => (
            <div key={file.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center min-w-0 flex-1">
                    {getFileIcon(file)}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 break-words" title={file.name}>
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {file.isFolder ? 'Klasör' : file.size}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-medium">Son Değişiklik:</span> {formatDate(file.modifiedTime)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openFileInNewTab(file)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {file.isFolder ? 'Aç' : 'Görüntüle'}
                  </button>
                  {!file.isFolder && (
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      İndir
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedFiles.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {files.length === 0 ? 'Dosya bulunamadı' : 'Arama sonucu bulunamadı'}
            </h3>
            <p className="text-gray-600">
              {files.length === 0 
                ? 'Google Drive klasöründe desteklenen dosya bulunamadı'
                : 'Farklı arama terimleri deneyebilir veya filtreleri değiştirebilirsiniz'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleDrivePriceListManager;