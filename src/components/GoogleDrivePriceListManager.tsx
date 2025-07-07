import React, { useState, useEffect } from 'react';
import { Search, Download, AlertCircle, ExternalLink, ArrowUpDown, Folder, ChevronRight, Home, FolderOpen } from 'lucide-react';
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

interface BreadcrumbItem {
  id: string;
  name: string;
}

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

const GoogleDrivePriceListManager: React.FC = () => {
  const [files, setFiles] = useState<PriceListFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const driveService = GoogleDriveService.getInstance();

  const loadFiles = async (folderId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const driveFiles = await driveService.getFilesFromFolder(folderId);
      
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
      
      // En son değişiklik tarihini bul
      if (processedFiles.length > 0) {
        const latestModification = processedFiles.reduce((latest, file) => {
          return file.modifiedTime > latest ? file.modifiedTime : latest;
        }, processedFiles[0].modifiedTime);
        setLastUpdate(latestModification);
      } else {
        setLastUpdate(new Date());
      }
    } catch (err) {
      setError('Dosyalar yüklenirken hata oluştu. Lütfen API anahtarınızı kontrol edin.');
      console.error('Dosya yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentFolderId);
  }, [currentFolderId]);

  const navigateToFolder = async (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    
    // Breadcrumb güncelle
    if (folderId === '') {
      // Ana klasöre dönüş
      setBreadcrumbs([]);
    } else {
      // Yeni klasöre giriş - breadcrumb'a ekle
      const newBreadcrumb = { id: folderId, name: folderName };
      setBreadcrumbs(prev => [...prev, newBreadcrumb]);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      // Ana klasöre git
      setCurrentFolderId('');
      setBreadcrumbs([]);
    } else {
      // Belirli bir breadcrumb seviyesine git
      const targetBreadcrumb = breadcrumbs[index];
      setCurrentFolderId(targetBreadcrumb.id);
      setBreadcrumbs(prev => prev.slice(0, index + 1));
    }
  };

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

  const handleFileClick = (file: PriceListFile) => {
    if (file.isFolder) {
      navigateToFolder(file.id, file.name);
    } else {
      window.open(file.viewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getFileIcon = (file: PriceListFile) => {
    if (file.isFolder) {
      return (
        <div className="h-12 w-12 mr-4 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <Folder className="h-6 w-6 text-white" />
        </div>
      );
    }
    
    switch (file.type) {
      case 'pdf':
        return (
          <div className="h-12 w-12 mr-4 flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
            <div className="text-white text-xs font-bold leading-none">PDF</div>
            <div className="w-6 h-1 bg-white rounded-full mt-1 opacity-80"></div>
          </div>
        );
      case 'excel':
        return (
          <div className="h-12 w-12 mr-4 flex flex-col items-center justify-center bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <div className="text-white text-xs font-bold leading-none">XLS</div>
            <div className="grid grid-cols-2 gap-0.5 mt-1">
              <div className="w-1.5 h-1 bg-white rounded-sm opacity-80"></div>
              <div className="w-1.5 h-1 bg-white rounded-sm opacity-80"></div>
              <div className="w-1.5 h-1 bg-white rounded-sm opacity-80"></div>
              <div className="w-1.5 h-1 bg-white rounded-sm opacity-80"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-12 w-12 mr-4 flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl shadow-lg">
            <div className="text-white text-xs font-bold">FILE</div>
          </div>
        );
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            onClick={() => loadFiles(currentFolderId)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
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
                {lastUpdate ? `Son değişiklik: ${formatDate(lastUpdate)}` : 'Yükleniyor...'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-1">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-blue-600">{stats.folders}</div>
                <div className="text-xs text-gray-500">Klasör</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg mb-1">
                  <div className="text-red-600 text-xs font-bold">PDF</div>
                </div>
                <div className="text-xl font-bold text-red-600">{stats.pdfs}</div>
                <div className="text-xs text-gray-500">PDF</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-1">
                  <div className="text-green-600 text-xs font-bold">XLS</div>
                </div>
                <div className="text-xl font-bold text-green-600">{stats.excels}</div>
                <div className="text-xs text-gray-500">Excel</div>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => navigateToBreadcrumb(-1)}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
              >
                <Home className="h-4 w-4 mr-1" />
                Ana Klasör
              </button>
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.id}>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className="text-blue-600 hover:text-blue-800 transition-colors truncate max-w-[200px] px-3 py-2 rounded-lg hover:bg-blue-50"
                    title={breadcrumb.name}
                  >
                    {breadcrumb.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}

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
            <div key={file.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="p-6">
                <div className="flex items-start mb-4">
                  {getFileIcon(file)}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center">
                      {file.isFolder ? (
                        <>
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Klasör
                        </>
                      ) : (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                          {file.size}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4 bg-gray-50 rounded-lg p-3">
                  <span className="font-medium">Son Değişiklik:</span>
                  <br />
                  {formatDate(file.modifiedTime)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleFileClick(file)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    {file.isFolder ? (
                      <>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Aç
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Görüntüle
                      </>
                    )}
                  </button>
                  {!file.isFolder && (
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
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
            <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-4">
              <Folder className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {files.length === 0 ? 'Dosya bulunamadı' : 'Arama sonucu bulunamadı'}
            </h3>
            <p className="text-gray-600">
              {files.length === 0 
                ? 'Bu klasörde desteklenen dosya bulunamadı'
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