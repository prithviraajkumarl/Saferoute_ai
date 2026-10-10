import React, { useState } from 'react';
import { AlertTriangle, X, MapPin, Send } from 'lucide-react';
import { api } from '../services/api';
import { HazardReport } from '../types';

interface ReportHazardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHazardAdded: (hazard: HazardReport) => void;
  defaultLat?: number;
  defaultLng?: number;
}

export const ReportHazardModal: React.FC<ReportHazardModalProps> = ({
  isOpen,
  onClose,
  onHazardAdded,
  defaultLat = 13.00,
  defaultLng = 80.22,
}) => {
  const [hazardType, setHazardType] = useState('waterlogging');
  const [severity, setSeverity] = useState('SEVERE');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await api.reportHazard({
        hazard_type: hazardType,
        severity,
        description,
        latitude: lat,
        longitude: lng,
        source: 'CITIZEN_REPORT',
      });
      onHazardAdded(created);
      onClose();
    } catch (err) {
      alert(`Error submitting hazard: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 text-slate-800 border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Report Road Hazard or Obstruction
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Hazard Category
            </label>
            <select
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="waterlogging">Deep Waterlogging / Flooding</option>
              <option value="road_damage">Road Cave-in / Damaged Bridge</option>
              <option value="tree_fallen">Fallen Tree / Electric Pole</option>
              <option value="landslide">Hill Landslide / Rockfall</option>
              <option value="traffic_block">Severe Gridlock / Bridge Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Severity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['LOW', 'SEVERE', 'CRITICAL'].map((sev) => (
                <button
                  type="button"
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    severity === sev
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Location Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 2.5 ft standing water near bus stand. Light cars cannot pass."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-500">
            <div>
              <label className="block font-semibold mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
