import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import type { PieceMark } from '../../types/database.types';
import type {
  QualityInspection,
  InspectionItem,
  InspectionSummary,
  QualityChecklistTemplate,
  InspectionType,
  ItemResult,
  InspectionPhoto
} from '../../types/quality.types';
import { qualityService } from '../../services/quality.service';
import { useAuth } from '../auth/useAuth';
import { WeldingInspectionForm } from './WeldingInspectionForm';
import { DimensionalCheckForm } from './DimensionalCheckForm';

interface QualityChecklistProps {
  pieceMark: PieceMark;
  onInspectionComplete?: (inspection: QualityInspection) => void;
  onClose?: () => void;
}

export const QualityChecklist: React.FC<QualityChecklistProps> = ({
  pieceMark,
  onInspectionComplete,
  onClose,
}) => {
  const { user, profile } = useAuth();
  const [inspectionType, setInspectionType] = useState<InspectionType>('general');
  const [templates, setTemplates] = useState<QualityChecklistTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<QualityChecklistTemplate | null>(null);
  const [currentInspection, setCurrentInspection] = useState<QualityInspection | null>(null);
  const [inspectionItems, setInspectionItems] = useState<Map<string, InspectionItem>>(new Map());
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'welding' | 'dimensional' | 'photos' | 'summary'>('checklist');
  const [notes, setNotes] = useState('');
  const [showWeldingForm, setShowWeldingForm] = useState(false);
  const [showDimensionalForm, setShowDimensionalForm] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const fetchTemplates = async () => {
    try {
      const data = await qualityService.getChecklistTemplates(inspectionType);
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const startInspection = async () => {
    if (!user || !selectedTemplate) return;

    setLoading(true);
    try {
      const inspection = await qualityService.createInspection(
        pieceMark.id,
        pieceMark.project_id,
        inspectionType,
        user.id,
        selectedTemplate.id
      );
      setCurrentInspection(inspection);
      initializeChecklistItems(selectedTemplate);
    } catch (error) {
      console.error('Error starting inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeChecklistItems = (template: QualityChecklistTemplate) => {
    const items = new Map<string, InspectionItem>();
    
    template.checklist_items.forEach(category => {
      category.items.forEach(item => {
        const key = `${category.category}-${item.name}`;
        items.set(key, {
          id: '',
          inspection_id: currentInspection?.id || '',
          item_name: item.name,
          category: category.category,
          specification: item.criteria,
          result: 'na' as ItemResult,
          severity: 'minor',
          created_at: new Date().toISOString(),
          comments: undefined,
        });
      });
    });

    setInspectionItems(items);
  };

  const updateChecklistItem = (key: string, result: ItemResult, comments?: string) => {
    const updatedItems = new Map(inspectionItems);
    const item = updatedItems.get(key);
    if (item) {
      item.result = result;
      item.comments = comments;
      updatedItems.set(key, item);
      setInspectionItems(updatedItems);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
    onDrop: async (acceptedFiles) => {
      if (!currentInspection || !user) return;
      
      setLoading(true);
      try {
        for (const file of acceptedFiles) {
          const photo = await qualityService.uploadInspectionPhoto(
            file,
            currentInspection.id,
            'during',
            `Inspection photo - ${new Date().toLocaleDateString()}`
          );
          setPhotos(prev => [...prev, photo]);
        }
      } catch (error) {
        console.error('Error uploading photos:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  const completeInspection = async () => {
    if (!currentInspection) return;

    setLoading(true);
    try {
      // Save all inspection items
      const items = Array.from(inspectionItems.values()).map(item => ({
        ...item,
        inspection_id: currentInspection.id,
      }));
      
      await qualityService.addInspectionItems(items);

      // Calculate summary
      const summary = qualityService.calculateInspectionSummary(items);
      
      // Determine overall result
      let overallResult: 'pass' | 'fail' | 'conditional_pass' | 'needs_reinspection';
      if (summary.critical_issues > 0) {
        overallResult = 'fail';
      } else if (summary.major_issues > 0) {
        overallResult = 'needs_reinspection';
      } else if (summary.minor_issues > 0) {
        overallResult = 'conditional_pass';
      } else {
        overallResult = 'pass';
      }

      // Update inspection status
      const updatedInspection = await qualityService.updateInspectionStatus(
        currentInspection.id,
        overallResult === 'pass' ? 'passed' : overallResult === 'fail' ? 'failed' : 'conditional',
        overallResult,
        notes
      );

      onInspectionComplete?.(updatedInspection);
    } catch (error) {
      console.error('Error completing inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (result: ItemResult) => {
    switch (result) {
      case 'pass': return 'text-green-600 bg-green-50';
      case 'fail': return 'text-red-600 bg-red-50';
      case 'conditional': return 'text-yellow-600 bg-yellow-50';
      case 'na': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSummary = (): InspectionSummary => {
    return qualityService.calculateInspectionSummary(Array.from(inspectionItems.values()));
  };

  const canInspect = ['admin', 'project_manager', 'shop'].includes(profile?.role || '');

  if (!canInspect) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">You don't have permission to perform quality inspections.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Quality Control Inspection</h2>
            <p className="text-indigo-100 mt-1">
              Piece Mark: {pieceMark.mark} - {pieceMark.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-indigo-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Setup Section (if no inspection started) */}
      {!currentInspection && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Type
              </label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value as InspectionType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="general">General Inspection</option>
                <option value="welding">Welding Inspection</option>
                <option value="dimensional">Dimensional Check</option>
                <option value="coating">Coating Inspection</option>
                <option value="bolting">Bolting Inspection</option>
                <option value="final">Final Inspection</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  setSelectedTemplate(template || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={startInspection}
            disabled={!selectedTemplate || loading}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting Inspection...' : 'Start Inspection'}
          </button>
        </div>
      )}

      {/* Inspection Tabs */}
      {currentInspection && (
        <>
          <div className="border-b">
            <div className="flex space-x-1 overflow-x-auto p-4">
              {['checklist', ...(inspectionType === 'welding' ? ['welding' as const] : []), 
                ...(inspectionType === 'dimensional' ? ['dimensional' as const] : []), 
                'photos', 'summary'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'checklist' | 'welding' | 'dimensional' | 'photos' | 'summary')}
                  className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-white text-indigo-600 border-t-2 border-indigo-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Checklist Tab */}
            {activeTab === 'checklist' && selectedTemplate && (
              <div className="space-y-6">
                {selectedTemplate.checklist_items.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-4 text-gray-800">
                      {category.category}
                    </h3>
                    <div className="space-y-3">
                      {category.items.map((item, itemIndex) => {
                        const key = `${category.category}-${item.name}`;
                        const inspectionItem = inspectionItems.get(key);
                        
                        return (
                          <div key={itemIndex} className="border-b pb-3 last:border-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {item.name}
                                  {item.required && <span className="text-red-500 ml-1">*</span>}
                                </p>
                                <p className="text-sm text-gray-600">{item.criteria}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-2">
                              {(['pass', 'fail', 'conditional', 'na'] as ItemResult[]).map(result => (
                                <button
                                  key={result}
                                  onClick={() => updateChecklistItem(key, result)}
                                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    inspectionItem?.result === result
                                      ? getResultColor(result)
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {result.toUpperCase()}
                                </button>
                              ))}
                            </div>

                            {(inspectionItem?.result === 'fail' || inspectionItem?.result === 'conditional') && (
                              <textarea
                                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Add comments (required for fail/conditional)..."
                                value={inspectionItem?.comments || ''}
                                onChange={(e) => updateChecklistItem(key, inspectionItem.result, e.target.value)}
                                rows={2}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Notes Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Additional Notes</h3>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Add any additional observations or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Welding Inspection Tab */}
            {activeTab === 'welding' && inspectionType === 'welding' && (
              <div>
                {showWeldingForm ? (
                  <WeldingInspectionForm
                    inspectionId={currentInspection.id}
                    onComplete={() => {
                      setShowWeldingForm(false);
                      setActiveTab('summary');
                    }}
                    onCancel={() => setShowWeldingForm(false)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Welding Inspection</h3>
                    <p className="text-gray-600 mb-4">Perform detailed welding quality checks</p>
                    <button
                      onClick={() => setShowWeldingForm(true)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Start Welding Inspection
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dimensional Check Tab */}
            {activeTab === 'dimensional' && inspectionType === 'dimensional' && (
              <div>
                {showDimensionalForm ? (
                  <DimensionalCheckForm
                    inspectionId={currentInspection.id}
                    onComplete={() => {
                      setShowDimensionalForm(false);
                      setActiveTab('summary');
                    }}
                    onCancel={() => setShowDimensionalForm(false)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Dimensional Check</h3>
                    <p className="text-gray-600 mb-4">Verify dimensions against specifications</p>
                    <button
                      onClick={() => setShowDimensionalForm(true)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Start Dimensional Check
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {isDragActive ? (
                    <p className="text-indigo-600">Drop photos here...</p>
                  ) : (
                    <>
                      <p className="text-gray-600">Drag & drop inspection photos here</p>
                      <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                    </>
                  )}
                </div>

                {/* Photo Gallery */}
                {photos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Uploaded Photos ({photos.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || `Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                            onClick={() => window.open(photo.photo_url, '_blank')}
                          />
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {photo.caption}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* Statistics */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Inspection Summary</h3>
                  
                  {(() => {
                    const summary = getSummary();
                    return (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{summary.passed}</p>
                            <p className="text-sm text-gray-600">Passed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-red-600">{summary.failed}</p>
                            <p className="text-sm text-gray-600">Failed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-yellow-600">{summary.conditional}</p>
                            <p className="text-sm text-gray-600">Conditional</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-gray-600">{summary.na}</p>
                            <p className="text-sm text-gray-600">N/A</p>
                          </div>
                        </div>

                        {/* Pass Rate */}
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Pass Rate</span>
                            <span className="font-semibold">{summary.pass_rate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full ${
                                summary.pass_rate >= 90 ? 'bg-green-500' :
                                summary.pass_rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${summary.pass_rate}%` }}
                            />
                          </div>
                        </div>

                        {/* Issues by Severity */}
                        {(summary.critical_issues > 0 || summary.major_issues > 0 || summary.minor_issues > 0) && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Issues by Severity</h4>
                            <div className="space-y-2">
                              {summary.critical_issues > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Critical Issues</span>
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                    {summary.critical_issues}
                                  </span>
                                </div>
                              )}
                              {summary.major_issues > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Major Issues</span>
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                    {summary.major_issues}
                                  </span>
                                </div>
                              )}
                              {summary.minor_issues > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Minor Issues</span>
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                    {summary.minor_issues}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Failed Items List */}
                {Array.from(inspectionItems.values()).some(item => item.result === 'fail') && (
                  <div className="bg-red-50 rounded-lg p-6">
                    <h4 className="font-semibold text-red-900 mb-3">Failed Items</h4>
                    <div className="space-y-2">
                      {Array.from(inspectionItems.values())
                        .filter(item => item.result === 'fail')
                        .map((item, index) => (
                          <div key={index} className="bg-white rounded p-3">
                            <p className="font-medium text-red-700">{item.item_name}</p>
                            <p className="text-sm text-gray-600">{item.category}</p>
                            {item.comments && (
                              <p className="text-sm text-gray-700 mt-1">Comments: {item.comments}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                {(() => {
                  const summary = getSummary();
                  const hasIssues = summary.critical_issues > 0 || summary.failed > 0;
                  return (
                    <span className={`font-medium ${hasIssues ? 'text-red-600' : 'text-green-600'}`}>
                      {hasIssues ? '⚠️ Issues Found' : '✅ Ready to Pass'}
                    </span>
                  );
                })()}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={completeInspection}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Completing...' : 'Complete Inspection'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};