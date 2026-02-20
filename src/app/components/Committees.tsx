import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, MoreHorizontal, Eye, Edit2, Archive, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Committees: React.FC = () => {
  const { committees, addCommittee, deleteCommittee, updateCommittee } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitteeName.trim()) {
      toast.error('Committee name cannot be empty');
      return;
    }
    setIsLoading(true);
    try {
      await addCommittee({ name: newCommitteeName, status: 'Active' });
      setNewCommitteeName('');
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCommittee = async (id: string) => {
    if (!editingName.trim()) {
      toast.error('Committee name cannot be empty');
      return;
    }
    setIsLoading(true);
    try {
      await updateCommittee(id, { name: editingName });
      setEditingId(null);
      setEditingName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCommittee = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this committee? All associated events will also be deleted.')) {
      await deleteCommittee(id);
    }
  };

  const handleArchiveCommittee = async (id: string) => {
    const committee = committees.find(c => c.id === id);
    if (committee) {
      await updateCommittee(id, { status: committee.status === 'Active' ? 'Archived' : 'Active' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Committees Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage event committees and their configurations</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          disabled={isLoading}
        >
          <Plus size={18} />
          Add Committee
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Committee Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {committees.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                  No committees found. Add one to get started.
                </td>
              </tr>
            ) : (
              committees.map((committee) => (
                <tr key={committee.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === committee.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-3 py-1 border border-blue-300 rounded-md focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-slate-900">{committee.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      committee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {committee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === committee.id ? (
                        <>
                          <button
                            onClick={() => handleEditCommittee(committee.id)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                            disabled={isLoading}
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 size={16} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                            className="p-2 text-slate-500 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(committee.id);
                              setEditingName(committee.name);
                            }}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleArchiveCommittee(committee.id)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title={committee.status === 'Active' ? 'Archive' : 'Activate'}
                          >
                            <Archive size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCommittee(committee.id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Committee</h3>
            <form onSubmit={handleAddCommittee}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Committee Name</label>
                <input
                  type="text"
                  value={newCommitteeName}
                  onChange={(e) => setNewCommitteeName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                  placeholder="e.g., Literary Committee"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Creating' : 'Create Committee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
