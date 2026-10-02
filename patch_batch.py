import re

with open('src/components/MaplibreComponent.tsx', 'r') as f:
    code = f.read()

target = r"""        \{/\* 2\. Dynamic DB Spatial layers overlay \*/\}
        \{props\.spatialLayers\.map\(\(layer\) => \{
          if \(layer\.id === "layer_kecamatan"\) return null;
          if \(layer\.id === "layer_jalan"\) return null;
          if \(layer\.id === "layer_zonasi" \|\| layer\.id === "layer_land_use_zoning"\) return null;
          if \(layer\.id === "layer_desa"\) return null;
          if \(!layer\.isActive\) return null;

          const normalized = dynamicSpatialLayersGeoJSON\[layer\.id\];
          if \(!normalized \|\| !normalized\.type\) return null;

          const isLine = \(layer\.lineWidth && layer\.lineWidth > 0\);

          return \(
            <React\.Fragment key=\{layer\.id\}>
              <Source id=\{`spatial-source-\$\{layer\.id\}`\} type="geojson" data=\{forceFeatureCollection\(partitionedDynamicLayers\[layer\.id\] \|\| normalized\) as any\} generateId=\{true\} tolerance=\{0\.3\} buffer=\{64\} maxzoom=\{14\} cluster=\{false\}>
                \{/\* Polygon Fill \*/\}
                <Layer
                  id=\{`spatial-layer-fill-\$\{layer\.id\}`\}
                  type="fill"
                  filter=\{\['any', \['==', \['geometry-type'\], 'Polygon'\], \['==', \['geometry-type'\], 'MultiPolygon'\]\]\}
                  paint=\{\{
                    "fill-color": layer\.id === "layer_potensi" \? \[
                      "match",
                      \["get", "sektor_utama"\],
                      "Kelautan", "#3b82f6",
                      "Pertanian", "#10b981",
                      "Pertambangan", "#f59e0b",
                      "Perdagangan", "#8b5cf6",
                      "Pariwisata", "#ec4899",
                      layer\.color \|\| "#10b981"
                    \] : \(layer\.color \|\| "#3b82f6"\),
                    "fill-opacity": typeof layer\.opacity === 'number' && !isNaN\(layer\.opacity\) \? Math\.min\(Math\.max\(layer\.opacity, 0\.4\), 0\.6\) : 0\.50,
                    "fill-opacity-transition": \{ duration: 300 \},
                    "fill-outline-color": layer\.color \|\| "#1e3a8a",
                  \}\}
                />
                \{/\* Polygon/LineString Stroke \*/\}
                <Layer
                  id=\{`spatial-layer-stroke-\$\{layer\.id\}`\}
                  type="line"
                  filter=\{\['any', \['==', \['geometry-type'\], 'Polygon'\], \['==', \['geometry-type'\], 'MultiPolygon'\], \['==', \['geometry-type'\], 'LineString'\], \['==', \['geometry-type'\], 'MultiLineString'\]\]\}
                  paint=\{\{
                    "line-color": layer\.color \|\| "#10b981", // default to emerald neon if not provided
                    "line-width": layer\.lineWidth \|\| 2\.5,
                    "line-opacity": typeof layer\.opacity === 'number' && !isNaN\(layer\.opacity\) \? layer\.opacity : 0\.9,
                    "line-opacity-transition": \{ duration: 300 \},
                  \}\}
                />
                \{/\* Point Circle \*/\}
                <Layer
                  id=\{`spatial-layer-point-\$\{layer\.id\}`\}
                  type="circle"
                  filter=\{\['any', \['==', \['geometry-type'\], 'Point'\], \['==', \['geometry-type'\], 'MultiPoint'\]\]\}
                  paint=\{\{
                    "circle-color": layer\.color \|\| "#10b981",
                    "circle-radius": layer\.id === "layer_infrastruktur" \? 8 : 6,
                    "circle-opacity": typeof layer\.opacity === 'number' && !isNaN\(layer\.opacity\) \? layer\.opacity : 1,
                    "circle-opacity-transition": \{ duration: 300 \},
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-opacity": typeof layer\.opacity === 'number' && !isNaN\(layer\.opacity\) \? layer\.opacity : 1,
                    "circle-stroke-opacity-transition": \{ duration: 300 \},
                  \}\}
                />
              </Source>
            </React\.Fragment>
          \);
        \}\)}"""

replacement = """        {/* 2. Dynamic DB Spatial layers overlay */}
        {(() => {
          // BATCHING THEMATIC OVERLAYS: Combine standard thematic layers into a single Source
          const excludedIds = ["layer_kecamatan", "layer_jalan", "layer_zonasi", "layer_land_use_zoning", "layer_desa", "layer_potensi"];
          const thematicLayers = props.spatialLayers.filter(l => !excludedIds.includes(l.id) && l.isActive);
          const customLayers = props.spatialLayers.filter(l => l.id === "layer_potensi" && l.isActive);

          const batchedFeatures: any[] = [];
          thematicLayers.forEach(layer => {
            const normalized = partitionedDynamicLayers[layer.id] || dynamicSpatialLayersGeoJSON[layer.id];
            if (normalized && normalized.type === "FeatureCollection" && normalized.features) {
              normalized.features.forEach((feat: any) => {
                batchedFeatures.push({
                  ...feat,
                  properties: {
                    ...feat.properties,
                    __batch_layer_id: layer.id
                  }
                });
              });
            } else if (normalized && normalized.type === "Feature") {
                batchedFeatures.push({
                  ...normalized,
                  properties: {
                    ...normalized.properties,
                    __batch_layer_id: layer.id
                  }
                });
            }
          });

          const batchedSourceData = {
            type: "FeatureCollection",
            features: batchedFeatures
          };

          return (
            <>
              {thematicLayers.length > 0 && batchedFeatures.length > 0 && (
                <Source id="batched-thematic-source" type="geojson" data={batchedSourceData as any} generateId={true} tolerance={0.3} buffer={64} maxzoom={14} cluster={false}>
                  {thematicLayers.map(layer => (
                    <React.Fragment key={`batch-${layer.id}`}>
                      {/* Polygon Fill */}
                      <Layer
                        id={`spatial-layer-fill-${layer.id}`}
                        type="fill"
                        filter={['all', ['==', ['get', '__batch_layer_id'], layer.id], ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]]}
                        paint={{
                          "fill-color": layer.color || "#3b82f6",
                          "fill-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? Math.min(Math.max(layer.opacity, 0.4), 0.6) : 0.50,
                          "fill-opacity-transition": { duration: 300 },
                          "fill-outline-color": layer.color || "#1e3a8a",
                        }}
                      />
                      {/* Polygon/LineString Stroke */}
                      <Layer
                        id={`spatial-layer-stroke-${layer.id}`}
                        type="line"
                        filter={['all', ['==', ['get', '__batch_layer_id'], layer.id], ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon'], ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']]]}
                        paint={{
                          "line-color": layer.color || "#10b981",
                          "line-width": layer.lineWidth || 2.5,
                          "line-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 0.9,
                          "line-opacity-transition": { duration: 300 },
                        }}
                      />
                      {/* Point Circle */}
                      <Layer
                        id={`spatial-layer-point-${layer.id}`}
                        type="circle"
                        filter={['all', ['==', ['get', '__batch_layer_id'], layer.id], ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]]}
                        paint={{
                          "circle-color": layer.color || "#10b981",
                          "circle-radius": layer.id === "layer_infrastruktur" ? 8 : 6,
                          "circle-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1,
                          "circle-opacity-transition": { duration: 300 },
                          "circle-stroke-width": 2,
                          "circle-stroke-color": "#ffffff",
                          "circle-stroke-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1,
                          "circle-stroke-opacity-transition": { duration: 300 },
                        }}
                      />
                    </React.Fragment>
                  ))}
                </Source>
              )}

              {/* Render custom layers individually (like layer_potensi) */}
              {customLayers.map(layer => {
                const normalized = partitionedDynamicLayers[layer.id] || dynamicSpatialLayersGeoJSON[layer.id];
                if (!normalized || !normalized.type) return null;
                return (
                  <Source key={`source-${layer.id}`} id={`spatial-source-${layer.id}`} type="geojson" data={forceFeatureCollection(normalized) as any} generateId={true} tolerance={0.3} buffer={64} maxzoom={14} cluster={false}>
                    {/* Polygon Fill */}
                    <Layer
                      id={`spatial-layer-fill-${layer.id}`}
                      type="fill"
                      filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
                      paint={{
                        "fill-color": layer.id === "layer_potensi" ? [
                          "match",
                          ["get", "sektor_utama"],
                          "Kelautan", "#3b82f6",
                          "Pertanian", "#10b981",
                          "Pertambangan", "#f59e0b",
                          "Perdagangan", "#8b5cf6",
                          "Pariwisata", "#ec4899",
                          layer.color || "#10b981"
                        ] : (layer.color || "#3b82f6"),
                        "fill-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? Math.min(Math.max(layer.opacity, 0.4), 0.6) : 0.50,
                        "fill-opacity-transition": { duration: 300 },
                        "fill-outline-color": layer.color || "#1e3a8a",
                      }}
                    />
                    {/* Polygon/LineString Stroke */}
                    <Layer
                      id={`spatial-layer-stroke-${layer.id}`}
                      type="line"
                      filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon'], ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']]}
                      paint={{
                        "line-color": layer.color || "#10b981", // default to emerald neon if not provided
                        "line-width": layer.lineWidth || 2.5,
                        "line-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 0.9,
                        "line-opacity-transition": { duration: 300 },
                      }}
                    />
                    {/* Point Circle */}
                    <Layer
                      id={`spatial-layer-point-${layer.id}`}
                      type="circle"
                      filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
                      paint={{
                        "circle-color": layer.color || "#10b981",
                        "circle-radius": layer.id === "layer_infrastruktur" ? 8 : 6,
                        "circle-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1,
                        "circle-opacity-transition": { duration: 300 },
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#ffffff",
                        "circle-stroke-opacity": typeof layer.opacity === 'number' && !isNaN(layer.opacity) ? layer.opacity : 1,
                        "circle-stroke-opacity-transition": { duration: 300 },
                      }}
                    />
                  </Source>
                );
              })}
            </>
          );
        })()}"""

code = re.sub(target, replacement, code, count=1)

with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(code)
