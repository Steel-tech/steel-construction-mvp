import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Simple Steel Construction Dashboard Component - No external dependencies
const SteelDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-gray-900 text-white">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold">🏗️ Steel Construction Pro</span>
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#dashboard" className="bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">📊 Dashboard</a>
                <a href="#projects" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700">🏗️ Projects</a>
                <a href="#workorders" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700">📋 Work Orders</a>
                <a href="#quality" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700">✅ Quality</a>
              </div>
            </div>
            <div className="flex items-center">
              <span className="bg-green-500 px-3 py-1 rounded-full text-xs font-bold">LIVE</span>
              <span className="ml-4">Demo User (Admin)</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Construction Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-500 w-12 h-12 rounded-lg mr-4 flex items-center justify-center text-white font-bold text-xl">12</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-sm text-gray-600">Active Projects</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-500 w-12 h-12 rounded-lg mr-4 flex items-center justify-center text-white font-bold text-xl">247</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">247</p>
                <p className="text-sm text-gray-600">Piece Marks</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-500 w-12 h-12 rounded-lg mr-4 flex items-center justify-center text-white font-bold text-xl">38</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">38</p>
                <p className="text-sm text-gray-600">Work Orders</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-orange-500 w-12 h-12 rounded-lg mr-4 flex items-center justify-center text-white font-bold text-xl">8</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-sm text-gray-600">Field Crews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow mb-8">
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

        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
          </div>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Downtown Tower</div>
                  <div className="text-sm text-gray-500">42-story mixed use</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                    <span className="text-sm text-gray-600">65%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$2.4M</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mar 2025</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Harbor Bridge</div>
                  <div className="text-sm text-gray-500">Cable-stayed design</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '40%'}}></div>
                    </div>
                    <span className="text-sm text-gray-600">40%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$5.8M</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Jun 2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>🏗️ Steel Construction Pro - Professional Construction Management</p>
          <p className="text-sm text-gray-400 mt-2">Connected to Backend API • {new Date().toLocaleDateString()}</p>
        </div>
      </footer>
    </div>
  );
};

// Initialize app
console.log('Initializing Steel Construction App...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  const root = createRoot(rootElement);
  root.render(<SteelDashboard />);
  console.log('✅ Steel Construction App mounted successfully!');
} catch (error) {
  console.error('❌ Failed to mount app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h1>⚠️ Application Error</h1>
      <p>Failed to load Steel Construction Dashboard</p>
      <p style="color: red;">${error}</p>
      <p><a href="/working.html" style="color: blue;">Try the static version</a></p>
    </div>
  `;
}
