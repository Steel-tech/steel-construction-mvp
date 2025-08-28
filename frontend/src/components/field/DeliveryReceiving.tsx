import React, { useState, useEffect } from 'react';
import type { Delivery, DeliveryItem, DeliveryStatus, PieceLocation } from '../../types/field.types';
import type { PieceMark } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface DeliveryReceivingProps {
  projectId: string;
  onDeliveryReceived?: () => void;
}

export const DeliveryReceiving: React.FC<DeliveryReceivingProps> = ({ 
  projectId, 
  onDeliveryReceived 
}) => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [pieceMarks, setPieceMarks] = useState<Record<string, PieceMark>>({});
  const [loading, setLoading] = useState(false);
  const [receivingMode, setReceivingMode] = useState(false);
  const [receivedItems, setReceivedItems] = useState<Record<string, { 
    quantity: number; 
    location: PieceLocation; 
    condition: 'good' | 'damaged' | 'missing';
    notes: string;
  }>>({});

  useEffect(() => {
    fetchDeliveries();
  }, [projectId]);

  useEffect(() => {
    if (selectedDelivery) {
      fetchDeliveryItems(selectedDelivery.id);
    }
  }, [selectedDelivery]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('project_id', projectId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryItems = async (deliveryId: string) => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('delivery_items')
        .select('*')
        .eq('delivery_id', deliveryId);

      if (itemsError) throw itemsError;

      if (items && items.length > 0) {
        const pieceMarkIds = items.map(item => item.piece_mark_id);
        const { data: marks, error: marksError } = await supabase
          .from('piece_marks')
          .select('*')
          .in('id', pieceMarkIds);

        if (marksError) throw marksError;

        const marksMap: Record<string, PieceMark> = {};
        marks?.forEach(mark => {
          marksMap[mark.id] = mark;
        });
        setPieceMarks(marksMap);
      }

      setDeliveryItems(items || []);

      // Initialize received items tracking
      const initialReceived: Record<string, any> = {};
      items?.forEach(item => {
        initialReceived[item.id] = {
          quantity: item.quantity,
          location: 'yard',
          condition: 'good',
          notes: '',
        };
      });
      setReceivedItems(initialReceived);
    } catch (error) {
      console.error('Error fetching delivery items:', error);
    }
  };

  const handleReceiveDelivery = async () => {
    if (!selectedDelivery || !user) return;

    setLoading(true);
    try {
      // Update delivery status
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .update({
          status: 'received',
          actual_date: new Date().toISOString(),
          received_by: user.id,
        })
        .eq('id', selectedDelivery.id);

      if (deliveryError) throw deliveryError;

      // Update delivery items with received details
      for (const [itemId, details] of Object.entries(receivedItems)) {
        const { error: itemError } = await supabase
          .from('delivery_items')
          .update({
            received_quantity: details.quantity,
            location: details.location,
            condition: details.condition,
            notes: details.notes,
          })
          .eq('id', itemId);

        if (itemError) throw itemError;

        // Update piece mark status to "shipped" or appropriate status
        const item = deliveryItems.find(di => di.id === itemId);
        if (item) {
          await supabase
            .from('piece_marks')
            .update({ status: 'shipped' })
            .eq('id', item.piece_mark_id);
        }
      }

      setReceivingMode(false);
      setSelectedDelivery(null);
      fetchDeliveries();
      onDeliveryReceived?.();
    } catch (error) {
      console.error('Error receiving delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateReceivedItem = (itemId: string, field: string, value: any) => {
    setReceivedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-xl font-bold mb-4">Delivery Receiving</h2>
        
        {/* Delivery List */}
        {!receivingMode ? (
          <div className="space-y-3">
            {deliveries.length === 0 ? (
              <p className="text-gray-500">No deliveries scheduled</p>
            ) : (
              deliveries.map(delivery => (
                <div 
                  key={delivery.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">#{delivery.delivery_number}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Scheduled: {new Date(delivery.scheduled_date).toLocaleDateString()}
                        {delivery.truck_number && ` • Truck: ${delivery.truck_number}`}
                      </div>
                    </div>
                    {delivery.status === 'delivered' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDelivery(delivery);
                          setReceivingMode(true);
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Receive
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Receiving Interface */
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Receiving Delivery #{selectedDelivery?.delivery_number}</h3>
              <button
                onClick={() => setReceivingMode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>

            {/* Items Checklist */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {deliveryItems.map(item => {
                const pieceMark = pieceMarks[item.piece_mark_id];
                const received = receivedItems[item.id];
                
                return (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">{pieceMark?.mark || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{pieceMark?.description}</p>
                        <p className="text-sm">Expected: {item.quantity} pcs</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Received Qty"
                            value={received?.quantity || ''}
                            onChange={(e) => updateReceivedItem(item.id, 'quantity', parseInt(e.target.value))}
                            className="px-2 py-1 border rounded text-sm"
                            min="0"
                            max={item.quantity}
                          />
                          <select
                            value={received?.condition || 'good'}
                            onChange={(e) => updateReceivedItem(item.id, 'condition', e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="good">Good</option>
                            <option value="damaged">Damaged</option>
                            <option value="missing">Missing</option>
                          </select>
                        </div>
                        
                        <select
                          value={received?.location || 'yard'}
                          onChange={(e) => updateReceivedItem(item.id, 'location', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="yard">Yard</option>
                          <option value="staging">Staging Area</option>
                          <option value="crane_zone">Crane Zone</option>
                          <option value="unknown">Unknown</option>
                        </select>
                        
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={received?.notes || ''}
                          onChange={(e) => updateReceivedItem(item.id, 'notes', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setReceivingMode(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReceiveDelivery}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Receipt'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Delivery Details */}
      {selectedDelivery && !receivingMode && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h3 className="font-semibold mb-3">Delivery Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Delivery Number</p>
              <p className="font-medium">{selectedDelivery.delivery_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedDelivery.status)}`}>
                {selectedDelivery.status}
              </span>
            </div>
            {selectedDelivery.truck_number && (
              <div>
                <p className="text-sm text-gray-600">Truck Number</p>
                <p className="font-medium">{selectedDelivery.truck_number}</p>
              </div>
            )}
            {selectedDelivery.driver_name && (
              <div>
                <p className="text-sm text-gray-600">Driver</p>
                <p className="font-medium">{selectedDelivery.driver_name}</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Items</p>
            <div className="space-y-2">
              {deliveryItems.map(item => {
                const pieceMark = pieceMarks[item.piece_mark_id];
                return (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <span className="font-medium">{pieceMark?.mark}</span>
                      <span className="text-sm text-gray-600 ml-2">({pieceMark?.description})</span>
                    </div>
                    <span className="text-sm font-medium">{item.quantity} pcs</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};