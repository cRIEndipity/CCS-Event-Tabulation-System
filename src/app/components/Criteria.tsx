import React, { useState, useEffect } from 'react';
import { useApp, Criterion, Event, Committee } from '../context/AppContext';
import { Plus, Trash2, AlertCircle, Save, Calculator, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const Criteria: React.FC = () => {
  const { events, updateEvent, committees, updateCommittee } = useApp();
  const [activeTab, setActiveTab] = useState<'criteria' | 'bearings'>('criteria');
  
  // Criteria State
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [currentCriteria, setCurrentCriteria] = useState<Criterion[]>([]);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionPercent, setNewCriterionPercent] = useState<string>('');

  // Bearings State
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('');
  const [baseBearing, setBaseBearing] = useState<string>('');
  const [eventRatings, setEventRatings] = useState<Record<string, { tl: string, c: string, ri: string, pi: string }>>({});

  // Load criteria when event changes
  useEffect(() => {
    if (selectedEventId) {
      const event = events.find(e => e.id === selectedEventId);
      if (event) {
        setCurrentCriteria(event.criteria || []);
      }
    } else {
      setCurrentCriteria([]);
    }
  }, [selectedEventId, events]);

  // Load committee/event data for bearings
  useEffect(() => {
    if (selectedCommitteeId) {
      const committee = committees.find(c => c.id === selectedCommitteeId);
      if (committee) {
        setBaseBearing(committee.baseBearing?.toString() || '0');
      }
      
      const committeeEvents = events.filter(e => e.committeeId === selectedCommitteeId);
      const ratings: Record<string, any> = {};
      committeeEvents.forEach(e => {
        ratings[e.id] = {
          tl: e.ratingTL?.toString() || '0',
          c: e.ratingC?.toString() || '0',
          ri: e.ratingRI?.toString() || '0',
          pi: e.ratingPI?.toString() || '0'
        };
      });
      setEventRatings(ratings);
    }
  }, [selectedCommitteeId, committees, events]);

  // --- Criteria Logic ---
  const totalPercentage = currentCriteria.reduce((sum, c) => sum + c.percentage, 0);
  const isCriteriaValid = totalPercentage === 100;

  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseFloat(newCriterionPercent);
    
    if (newCriterionName && !isNaN(percent)) {
      if (totalPercentage + percent > 100) {
        toast.error('Total percentage cannot exceed 100%');
        return;
      }

      const newCriterion: Criterion = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCriterionName,
        percentage: percent
      };

      setCurrentCriteria([...currentCriteria, newCriterion]);
      setNewCriterionName('');
      setNewCriterionPercent('');
    }
  };

  const handleRemoveCriterion = (id: string) => {
    setCurrentCriteria(currentCriteria.filter(c => c.id !== id));
  };

  const handleSaveCriteria = () => {
    if (!isCriteriaValid) {
      toast.error('Total percentage must be exactly 100%');
      return;
    }
    if (selectedEventId) {
      updateEvent(selectedEventId, { criteria: currentCriteria });
      toast.success('Criteria saved successfully');
    }
  };

  // --- Bearings Logic ---
  const calculateEventWeight = (tl: number, c: number, ri: number, pi: number) => {
    return (0.4 * tl) + (0.3 * c) + (0.2 * ri) + (0.1 * pi);
  };

  const updateEventRating = (eventId: string, field: 'tl' | 'c' | 'ri' | 'pi', value: string) => {
    setEventRatings(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [field]: value
      }
    }));
  };

  const handleSaveBearings = () => {
    if (!selectedCommitteeId) return;

    // Save Base Bearing
    updateCommittee(selectedCommitteeId, { baseBearing: parseFloat(baseBearing) || 0 });

    // Save Event Ratings
    Object.entries(eventRatings).forEach(([eventId, ratings]) => {
      updateEvent(eventId, {
        ratingTL: parseFloat(ratings.tl) || 0,
        ratingC: parseFloat(ratings.c) || 0,
        ratingRI: parseFloat(ratings.ri) || 0,
        ratingPI: parseFloat(ratings.pi) || 0
      });
    });

    toast.success('Bearings configuration saved successfully');
  };

  const renderBearingsTab = () => {
    const committee = committees.find(c => c.id === selectedCommitteeId);
    const committeeEvents = events.filter(e => e.committeeId === selectedCommitteeId);

    // Calculations
    const bBase = parseFloat(baseBearing) || 0;
    
    // Calculate weights for all events in this category
    const eventWeights = committeeEvents.map(e => {
      const r = eventRatings[e.id] || { tl: '0', c: '0', ri: '0', pi: '0' };
      const weight = calculateEventWeight(
        parseFloat(r.tl) || 0,
        parseFloat(r.c) || 0,
        parseFloat(r.ri) || 0,
        parseFloat(r.pi) || 0
      );
      return { id: e.id, weight };
    });

    const sumWeightCategory = eventWeights.reduce((sum, item) => sum + item.weight, 0);
    
    // Assume sum of all events in competition (for B_category formula)
    // For now, let's assume "all events" means "all events in this committee" effectively for the category calculation context, 
    // OR we need to sum ALL events in the system.
    // The formula: B_category = B_base + 16 * (Sum(Weight_category_events) / Sum(Weight_all_events))
    // Let's sum ALL events in the system.
    const allEventsInSystem = events;
    const sumWeightAll = allEventsInSystem.reduce((sum, e) => {
        // We might not have ratings for other committees loaded in local state map if not selected,
        // so we fall back to the saved `e.ratingTL` etc.
        const tl = e.ratingTL || 0;
        const c = e.ratingC || 0;
        const ri = e.ratingRI || 0;
        const pi = e.ratingPI || 0;
        return sum + calculateEventWeight(tl, c, ri, pi);
    }, 0); 
    // Note: This `sumWeightAll` will be slightly off until all events are saved. But it's the best we can do.
    
    // Re-calculate sumWeightAll using current editing values for the current committee
    // We need to subtract the saved values for this committee and add the current editing values
    const savedWeightCurrentCommittee = committeeEvents.reduce((sum, e) => {
        const tl = e.ratingTL || 0;
        const c = e.ratingC || 0;
        const ri = e.ratingRI || 0;
        const pi = e.ratingPI || 0;
        return sum + calculateEventWeight(tl, c, ri, pi);
    }, 0);
    
    const adjustedSumWeightAll = (sumWeightAll - savedWeightCurrentCommittee) + sumWeightCategory;

    const bCategory = adjustedSumWeightAll > 0 
      ? bBase + 16 * (sumWeightCategory / adjustedSumWeightAll)
      : bBase;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Committee (Category)</label>
          <select
            value={selectedCommitteeId}
            onChange={(e) => setSelectedCommitteeId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none"
          >
            <option value="">-- Select Committee --</option>
            {committees.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {selectedCommitteeId && (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Category Settings</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Base Bearing (B_base)</label>
                  <input
                    type="number"
                    value={baseBearing}
                    onChange={(e) => setBaseBearing(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Calculated Category Bearing (B_category)</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-blue-900">
                    {bCategory.toFixed(4)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Formula: B_category = B_base + 16 * (Sum(Weight_category) / Sum(Weight_all))
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Event Ratings & Weighting</h3>
              <div className="space-y-6">
                {committeeEvents.map(event => {
                  const ratings = eventRatings[event.id] || { tl: '', c: '', ri: '', pi: '' };
                  const weight = eventWeights.find(w => w.id === event.id)?.weight || 0;
                  
                  // B_event calculation
                  // Bevent = Bcategory * (Weightevent / Sum(Weight_all_events_in_category))
                  // "Sum(Weight_all_events_in_category)" is sumWeightCategory
                  const bEvent = sumWeightCategory > 0 
                    ? bCategory * (weight / sumWeightCategory)
                    : 0;

                  return (
                    <div key={event.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-700">{event.name}</h4>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          Bearing: {bEvent.toFixed(4)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 uppercase">Rating TL (0.4)</label>
                          <input
                            type="number"
                            value={ratings.tl}
                            onChange={(e) => updateEventRating(event.id, 'tl', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 uppercase">Rating C (0.3)</label>
                          <input
                            type="number"
                            value={ratings.c}
                            onChange={(e) => updateEventRating(event.id, 'c', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 uppercase">Rating RI (0.2)</label>
                          <input
                            type="number"
                            value={ratings.ri}
                            onChange={(e) => updateEventRating(event.id, 'ri', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 uppercase">Rating PI (0.1)</label>
                          <input
                            type="number"
                            value={ratings.pi}
                            onChange={(e) => updateEventRating(event.id, 'pi', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end items-center gap-2 text-xs text-slate-500">
                         <span>Event Weight: <b>{weight.toFixed(2)}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveBearings}
              className="w-full flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-md font-medium transition-colors shadow-sm"
            >
              <Save size={18} />
              Save Bearings Configuration
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Criteria & Bearings</h2>
        <p className="text-slate-500 text-sm mt-1">Configure scoring criteria and event bearings</p>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('criteria')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'criteria'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Event Criteria
        </button>
        <button
          onClick={() => setActiveTab('bearings')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'bearings'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Event Bearings
        </button>
      </div>

      {activeTab === 'criteria' ? (
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Event to Configure</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none"
            >
              <option value="">-- Select Event --</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {selectedEventId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Current Criteria</h3>
                    <span className={`text-sm font-bold ${isCriteriaValid ? 'text-green-600' : 'text-amber-600'}`}>
                      Total: {totalPercentage}%
                    </span>
                  </div>
                  
                  {currentCriteria.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No criteria defined yet. Add one below.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {currentCriteria.map((c) => (
                        <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                          <span className="text-slate-900 font-medium">{c.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-sm font-medium">
                              {c.percentage}%
                            </span>
                            <button 
                              onClick={() => handleRemoveCriterion(c.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddCriterion} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Criteria Name</label>
                    <input
                      type="text"
                      value={newCriterionName}
                      onChange={(e) => setNewCriterionName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-blue-500"
                      placeholder="e.g. Content"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Bearing (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCriterionPercent}
                      onChange={(e) => setNewCriterionPercent(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-blue-500"
                      placeholder="%"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newCriterionName || !newCriterionPercent || totalPercentage >= 100}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </form>
              </div>

              <div className="md:col-span-1 space-y-4">
                <div className={`p-4 rounded-lg border ${isCriteriaValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`shrink-0 ${isCriteriaValid ? 'text-green-600' : 'text-amber-600'}`} size={20} />
                    <div>
                      <h4 className={`font-medium ${isCriteriaValid ? 'text-green-900' : 'text-amber-900'}`}>
                        {isCriteriaValid ? 'Configuration Valid' : 'Configuration Invalid'}
                      </h4>
                      <p className={`text-sm mt-1 ${isCriteriaValid ? 'text-green-700' : 'text-amber-700'}`}>
                        {isCriteriaValid 
                          ? 'The total percentage equals 100%. You can save this configuration.' 
                          : `Total is ${totalPercentage}%. It must be exactly 100% to proceed.`}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveCriteria}
                  disabled={!isCriteriaValid}
                  className="w-full flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-md font-medium transition-colors shadow-sm"
                >
                  <Save size={18} />
                  Save Criteria
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        renderBearingsTab()
      )}
    </div>
  );
};