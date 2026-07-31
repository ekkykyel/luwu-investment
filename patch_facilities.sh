node -e "
const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const importTurf = 'import * as turf from \"@turf/turf\";';
if (!content.includes(importTurf)) {
  content = content.replace('import { useTranslation } from \"react-i18next\";', 'import { useTranslation } from \"react-i18next\";\nimport * as turf from \"@turf/turf\";');
}

const facilityState = \`  const [facilityCoords, setFacilityCoords] = useState<{ airport?: number[], port?: number[], mpp?: number[], industrial?: number[] }>({});

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const { data: infraData } = await supabase.from('gis_infrastruktur').select('geom, nama_infrastruktur');
        const { data: zonasiData } = await supabase.from('gis_zonasi').select('geom, keterangan').eq('keterangan', 'Kawasan Industri');
        
        const coords = {};
        if (infraData) {
          const airport = infraData.find(d => d.nama_infrastruktur && d.nama_infrastruktur.toLowerCase().includes('bandara'));
          if (airport && airport.geom && airport.geom.coordinates) coords.airport = [airport.geom.coordinates[0], airport.geom.coordinates[1]];
          
          const port = infraData.find(d => d.nama_infrastruktur && d.nama_infrastruktur.toLowerCase().includes('pelabuhan'));
          if (port && port.geom && port.geom.coordinates) coords.port = [port.geom.coordinates[0], port.geom.coordinates[1]];
          
          const mpp = infraData.find(d => d.nama_infrastruktur && d.nama_infrastruktur.toLowerCase().includes('bupati'));
          if (mpp && mpp.geom && mpp.geom.coordinates) coords.mpp = [mpp.geom.coordinates[0], mpp.geom.coordinates[1]];
        }
        
        if (zonasiData && zonasiData.length > 0 && zonasiData[0].geom) {
          try {
             const center = turf.center(zonasiData[0].geom);
             coords.industrial = [center.geometry.coordinates[0], center.geometry.coordinates[1]];
          } catch(e) {}
        }
        setFacilityCoords(coords);
      } catch (err) {}
    }
    fetchFacilities();
  }, []);\`;

// Insert after hasTriggeredInitialFullscreen
content = content.replace(
  'const hasTriggeredInitialFullscreen = useRef(false);',
  'const hasTriggeredInitialFullscreen = useRef(false);\n' + facilityState
);

// Modify baseFacilities to use facilityCoords if available
const newBaseFacilities = \`            const baseFacilities = [
              {
                name: t(\"infrastructure.buaAirportTitle\"),
                desc: t(\"infrastructure.buaAirportDesc\"),
                type: \"airport\",
                longitude: facilityCoords.airport ? facilityCoords.airport[0] : 120.24132322502385,
                latitude: facilityCoords.airport ? facilityCoords.airport[1] : -3.086338491260946,
              },
              {
                name: t(\"infrastructure.uloPortTitle\"),
                desc: t(\"infrastructure.uloPortDesc\"),
                type: \"port\",
                longitude: facilityCoords.port ? facilityCoords.port[0] : 120.39793462368112,
                latitude: facilityCoords.port ? facilityCoords.port[1] : -3.386061643485775,
              },
              {
                name: t(\"infrastructure.kiluTitle\"),
                desc: t(\"infrastructure.kiluDesc\"),
                type: \"industrial\",
                longitude: facilityCoords.industrial ? facilityCoords.industrial[0] : 120.252,
                latitude: facilityCoords.industrial ? facilityCoords.industrial[1] : -3.125,
              },
              {
                name: t(\"infrastructure.mppTitle\"),
                desc: t(\"infrastructure.mppDesc\"),
                type: \"mpp\",
                longitude: facilityCoords.mpp ? facilityCoords.mpp[0] : 120.36547889067685,
                latitude: facilityCoords.mpp ? facilityCoords.mpp[1] : -3.394828505594006,
              }
            ];\`;

content = content.replace(
  /const baseFacilities = \[\s*\{\s*name: t\(\"infrastructure\.buaAirportTitle\"\)[^]*?latitude: -3\.394828505594006,\s*\}\s*\];/m,
  newBaseFacilities
);

// Add facilityCoords to the dependency array of the useMemo
content = content.replace(
  /\}, \[t, selectedInvestmentId, investments, isDark, textMuted\]\)/,
  '}, [t, selectedInvestmentId, investments, isDark, textMuted, facilityCoords])'
);

fs.writeFileSync('src/components/LandingPage.tsx', content);
console.log('patched landing page');
"
