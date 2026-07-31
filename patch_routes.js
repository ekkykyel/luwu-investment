const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldRoutes = `  return (
    <Routes>
      <Route path="/operator-workspace" element={<AdminLayout currentRole={currentRole} />}>
        {/* Dashboard Overview shows the standard workspace view */}
        <Route index element={<div className="w-full h-full">{renderOperatorWorkspace()}</div>} />
        
        {/* Investments triggers the Add Modal automatically and shows workspace */}
        <Route path="investments" element={<div className="w-full h-full">{renderOperatorWorkspace()}</div>} />
        <Route path="investments/add" element={
          <div className="w-full h-full">
            {renderOperatorWorkspace()}
          </div>
        } />
        
        {/* Spatial Editor rendered inside the main content area of the layout */}
        <Route path="spatial" element={
          <div className="w-full h-full relative z-50">
            <SpatialEditorStudio
              currentRole={currentRole}
              isDarkMode={isDarkMode}
              onRefreshAllData={fetchAllData}
              spatialLayers={spatialLayers}
              setSpatialLayers={setSpatialLayers}
              districts={districts}
              villages={villages}
              initialModule="INVESTASI"
            />
          </div>
        } />
        
        {/* Other paths just render the workspace, the modals are triggered via useEffect below */}
        <Route path="spatial/editor" element={<div className="w-full h-full relative z-50"><SpatialEditorStudio currentRole={currentRole} isDarkMode={isDarkMode} onRefreshAllData={fetchAllData} spatialLayers={spatialLayers} setSpatialLayers={setSpatialLayers} districts={districts} villages={villages} initialModule="INVESTASI" /></div>} />
        <Route path="users" element={<div className="w-full h-full">{renderOperatorWorkspace()}</div>} />
        <Route path="users/add" element={<div className="w-full h-full">{renderOperatorWorkspace()}</div>} />
        <Route path="accounts" element={<div className="w-full h-full">{renderOperatorWorkspace()}</div>} />
        <Route path="tickets" element={<div className="w-full h-full">{renderOperatorWorkspace()}</div>} />
        <Route path="enterprise" element={<div className="w-full h-full">{renderOperatorWorkspace()}</div>} />
      </Route>
      <Route path="*" element={
        <div className={\`relative h-[100dvh] w-full overflow-hidden \${
          isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
        } font-sans\`}>`;

const newRoutes = `  return (
    <Routes>
      <Route path="*" element={
        <div className={\`relative h-[100dvh] w-full overflow-hidden \${
          isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
        } font-sans\`}>`;

if (code.includes(oldRoutes)) {
    code = code.replace(oldRoutes, newRoutes);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success replacing routes");
} else {
    console.log("Failed to find old routes block");
}
