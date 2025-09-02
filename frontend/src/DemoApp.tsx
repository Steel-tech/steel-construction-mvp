import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// Simple Dashboard Component
const Dashboard = () => {
  const stats = [
    { label: 'Active Projects', value: '12', color: 'bg-blue-500' },
    { label: 'Piece Marks', value: '247', color: 'bg-green-500' },
    { label: 'Work Orders', value: '38', color: 'bg-purple-500' },
    { label: 'Field Crews', value: '8', color: 'bg-orange-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Construction Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} w-12 h-12 rounded-lg mr-4`}></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <p className="text-gray-700">Piece Mark W-123 completed welding inspection</p>
              <span className="ml-auto text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <p className="text-gray-700">New work order #WO-456 created for Project Alpha</p>
              <span className="ml-auto text-sm text-gray-500">3 hours ago</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <p className="text-gray-700">Crew B assigned to Zone 3 installation</p>
              <span className="ml-auto text-sm text-gray-500">5 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Projects Component
const Projects = () => {
  const projects = [
    { id: 1, name: 'Downtown Tower', status: 'Active', progress: 65, budget: '$2.4M' },
    { id: 2, name: 'Harbor Bridge', status: 'Active', progress: 40, budget: '$5.8M' },
    { id: 3, name: 'Tech Campus', status: 'Planning', progress: 15, budget: '$3.2M' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Projects</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{project.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-600">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.budget}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Work Orders Component
const WorkOrders = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Work Orders</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 bg-gray-100 font-semibold text-gray-700">To Do</div>
          <div className="p-4 space-y-3">
            <div className="bg-gray-50 rounded p-3">
              <p className="font-medium">WO-789: Install beams Z1-Z4</p>
              <p className="text-sm text-gray-600 mt-1">Priority: High</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="font-medium">WO-790: Weld inspection batch 5</p>
              <p className="text-sm text-gray-600 mt-1">Priority: Medium</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 bg-blue-100 font-semibold text-blue-700">In Progress</div>
          <div className="p-4 space-y-3">
            <div className="bg-blue-50 rounded p-3">
              <p className="font-medium">WO-788: Column installation C1-C8</p>
              <p className="text-sm text-gray-600 mt-1">Crew: Team Alpha</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 bg-green-100 font-semibold text-green-700">Completed</div>
          <div className="p-4 space-y-3">
            <div className="bg-green-50 rounded p-3">
              <p className="font-medium">WO-787: Foundation prep sector A</p>
              <p className="text-sm text-gray-600 mt-1">Completed: Today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/projects', label: 'Projects', icon: '🏗️' },
    { path: '/work-orders', label: 'Work Orders', icon: '📋' },
    { path: '/quality', label: 'Quality Control', icon: '✅' },
    { path: '/field', label: 'Field Operations', icon: '🚧' },
  ];

  return (
    <nav className="bg-gray-900 text-white">
      <div className="px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold">🏗️ Steel Construction Pro</span>
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <span className="bg-green-500 px-3 py-1 rounded-full text-xs font-bold">DEMO MODE</span>
            <span className="ml-4">Demo User (Admin)</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Main App Component
export const DemoApp: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/quality" element={
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Quality Control</h1>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">Quality control inspections, NCR reports, and welding certifications</p>
              </div>
            </div>
          } />
          <Route path="/field" element={
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Field Operations</h1>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">Crew assignments, delivery tracking, and field progress</p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};