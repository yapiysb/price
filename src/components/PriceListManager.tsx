import React, { useState, useRef } from 'react';
import { Upload, Search, FileText, Sheet, Download, Eye, X, Filter } from 'lucide-react';

interface PriceListFile {
  id: string;
  name: string;
  type: 'pdf' | 'excel';
  size: number;
  uploadDate: Date;
  url: string;
  category?: string;
}

const PriceListManager: React.FC = () => {
  const [files, setFiles] = useState<PriceListFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [viewingFile, setViewingFile] = useState<PriceListFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['all', 'products', 'services', 'seasonal', 'bulk'];

  const handleFileUpload = (uploadedFiles: FileList) => {
    Array.from(uploadedFiles).forEach(file => {
      if (file.type === 'application/pdf' || 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel') {
        
        const fileType = file.type === 'application/pdf' ? 'pdf' : 'excel';
        const url = URL.createObjectURL(file);
        
        const newFile: PriceListFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: fileType,
          size: file.size,
          uploadDate: new Date(),
          url,
          category: 'products'
        };
        
        setFiles(prev => [...prev, newFile]);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const updateFileCategory = (id: string, category: string) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, category } : file
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Fiyat Listeleri</h1>
              <p className="text-gray-600">PDF ve Excel dosyalarını yükleyip yönetin</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{files.length}</div>
              <div className="text-sm text-gray-500">Toplam Dosya</div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Dosyaları buraya sürükleyin veya seçin
            </h3>
            <p className="text-gray-600 mb-4">PDF ve Excel dosyaları desteklenir</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Upload className="h-5 w-5 mr-2" />
              Dosya Seç
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Fiyat listelerinde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Kategoriler</option>
                  <option value="products">Ürünler</option>
                  <option value="services">Hizmetler</option>
                  <option value="seasonal">Mevsimlik</option>
                  <option value="bulk">Toptan</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <div key={file.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {file.type === 'pdf' ? (
                      <FileText className="h-8 w-8 text-red-500 mr-3" />
                    ) : (
                      <Sheet className="h-8 w-8 text-green-500 mr-3" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate max-w-[200px]" title={file.name}>
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <select
                    value={file.category}
                    onChange={(e) => updateFileCategory(file.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="products">Ürünler</option>
                    <option value="services">Hizmetler</option>
                    <option value="seasonal">Mevsimlik</option>
                    <option value="bulk">Toptan</option>
                  </select>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  {formatDate(file.uploadDate)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingFile(file)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Görüntüle
                  </button>
                  <a
                    href={file.url}
                    download={file.name}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFiles.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {files.length === 0 ? 'Henüz dosya yüklenmedi' : 'Arama sonucu bulunamadı'}
            </h3>
            <p className="text-gray-600">
              {files.length === 0 
                ? 'Fiyat listelerinizi yüklemek için yukarıdaki yükleme alanını kullanın'
                : 'Farklı arama terimleri deneyebilir veya filtreleri değiştirebilirsiniz'
              }
            </p>
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{viewingFile.name}</h3>
              <button
                onClick={() => setViewingFile(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 h-[calc(90vh-120px)]">
              {viewingFile.type === 'pdf' ? (
                <iframe
                  src={viewingFile.url}
                  className="w-full h-full rounded-lg"
                  title={viewingFile.name}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Sheet className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Excel Dosyası</h3>
                    <p className="text-gray-600 mb-4">
                      Bu dosyayı görüntülemek için indirmeniz gerekiyor
                    </p>
                    <a
                      href={viewingFile.url}
                      download={viewingFile.name}
                      className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Dosyayı İndir
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceListManager;