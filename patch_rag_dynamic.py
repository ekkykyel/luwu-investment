import re

with open('server.ts', 'r') as f:
    content = f.read()

fetch_docs = """
const fetchActiveDocuments = async () => {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('title, category, status')
    .eq('is_active', true);
    
  if (error || !data) return "";
  
  const docList = data.map((doc, index) => `${index + 1}. [Kategori: ${doc.category}] - ${doc.title}`).join('\\n');
  return `\\nDaftar Dokumen Referensi Aktif di Database Anda saat ini:\\n${docList}\\n`;
};

app.post("/api/gemini/chat\""""

content = content.replace('app.post("/api/gemini/chat"', fetch_docs)

# Find the start of systemInstruction
si_pattern = r"const systemInstruction = `Anda adalah Konsultan AI Geospasial MPP Simpurusiang Kabupaten Luwu, Indonesia\."
si_replacement = """const dynamicDocList = await fetchActiveDocuments();

    const systemInstruction = `Anda adalah Konsultan AI Geospasial MPP Simpurusiang Kabupaten Luwu, Indonesia."""

content = re.sub(si_pattern, si_replacement, content)

# Now, append the dynamic doc list to the end of system instruction before the trailing backtick
# Wait, it's a template literal.
# The template literal ends with:
# DOKUMEN CONTEXT REAL-TIME (SUPABASE & GIS MAP):
# ${ragContext}
# ${specificInvestmentContext}
# ${spatialStatsContext}
# ${simulationInjection}
# ${languageInstruction}`;

# Let's insert dynamicDocList before `DOKUMEN CONTEXT REAL-TIME`

target_insertion = "[PANDUAN NAVIGASI SPASIAL INTERAKTIF]"
replacement_insertion = "${dynamicDocList}\\nATURAN PENCARIAN: Jika pengguna bertanya hal yang berkaitan dengan daftar dokumen di atas, pastikan Anda menggunakan alat pencarian vektor Anda untuk mengekstrak detail dari dokumen tersebut.\\n\\n[PANDUAN NAVIGASI SPASIAL INTERAKTIF]"
content = content.replace(target_insertion, replacement_insertion)

if "// v2.0 feature: dynamic RAG document indexing" not in content:
    content += "\n// v2.0 feature: dynamic RAG document indexing\n"

with open('server.ts', 'w') as f:
    f.write(content)
