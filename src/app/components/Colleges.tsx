import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Plus, Trash2, Building2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Colleges: React.FC = () => {
  const { colleges, departments, addCollege, deleteCollege, addDepartment, deleteDepartment } = useApp();
  
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [newDeptColor, setNewDeptColor] = useState('#1e3a8a');
  const [isLoadingCollege, setIsLoadingCollege] = useState(false);
  const [isLoadingDept, setIsLoadingDept] = useState(false);

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim()) {
      toast.error('Please enter a college name');
      return;
    }
    setIsLoadingCollege(true);
    try {
      await addCollege({ name: newCollegeName });
      setNewCollegeName('');
    } finally {
      setIsLoadingCollege(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId) {
      toast.error('Please select a college');
      return;
    }
    if (!newDeptName.trim() || !newTeamName.trim()) {
      toast.error('Please enter both Department and Team name');
      return;
    }
    setIsLoadingDept(true);
    try {
      await addDepartment({
        collegeId: selectedCollegeId,
        name: newDeptName,
        teamName: newTeamName,
        color: newDeptColor
      });
      setNewDeptName('');
      setNewTeamName('');
      setSelectedCollegeId('');
    } finally {
      setIsLoadingDept(false);
    }
  };

  const handleDeleteCollege = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? All associated departments will also be deleted.`)) {
      await deleteCollege(id);
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (window.confirm(`Delete ${name}?`)) {
      await deleteDepartment(id);
    }
  };

  const getCollegeName = (id: string) => {
    return colleges.find(c => c.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">College & Team Management</h1>
          <p className="text-slate-500 mt-1">Configure the organizational structure for tabulation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* College Management */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-xl">Colleges</CardTitle>
            </div>
            <CardDescription>Add the main academic bodies (e.g., CCS, CEBA, etc.)</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAddCollege} className="flex gap-2 mb-6">
              <div className="flex-1">
                <Input 
                  placeholder="e.g. College of Computer Studies" 
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  disabled={isLoadingCollege}
                />
              </div>
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                disabled={isLoadingCollege}
              >
                {isLoadingCollege ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {isLoadingCollege ? 'Adding' : 'Add'}
              </Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">College Name</TableHead>
                  <TableHead className="w-[100px] text-right font-semibold text-slate-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colleges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-slate-400">No colleges added yet.</TableCell>
                  </TableRow>
                ) : (
                  colleges.map((college) => (
                    <TableRow key={college.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium">{college.name}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDeleteCollege(college.id, college.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Department/Team Management */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-xl">Departments & Teams</CardTitle>
            </div>
            <CardDescription>Define specific courses or merged teams within a college.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAddDepartment} className="space-y-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>College</Label>
                  <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId} disabled={isLoadingDept}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select College" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color Code</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      className="w-12 h-10 p-1 bg-white" 
                      value={newDeptColor} 
                      onChange={(e) => setNewDeptColor(e.target.value)}
                      disabled={isLoadingDept}
                    />
                    <Input 
                      className="flex-1" 
                      value={newDeptColor} 
                      onChange={(e) => setNewDeptColor(e.target.value)}
                      disabled={isLoadingDept}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department/s (Course)</Label>
                  <Input 
                    placeholder="e.g. BSCS/BSIS" 
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    disabled={isLoadingDept}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Team Name (Theme)</Label>
                  <Input 
                    placeholder="e.g. Mandalorians" 
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    disabled={isLoadingDept}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                disabled={isLoadingDept}
              >
                {isLoadingDept ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {isLoadingDept ? 'Adding' : 'Add Department / Team'}
              </Button>
            </form>

            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">College</TableHead>
                    <TableHead className="font-semibold text-slate-700">Details</TableHead>
                    <TableHead className="w-[80px] text-right font-semibold text-slate-700">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-slate-400">No departments added yet.</TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell>
                          <span className="text-xs font-bold text-slate-500 uppercase">{getCollegeName(dept.collegeId)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: dept.color }} 
                            />
                            <div>
                              <div className="font-semibold">{dept.teamName}</div>
                              <div className="text-xs text-slate-500">{dept.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDeleteDepartment(dept.id, dept.teamName)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
