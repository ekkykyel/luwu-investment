import json

def update_json(file_path, new_welcome):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "mppVision" in data and "welcome" in data["mppVision"]:
        data["mppVision"]["welcome"] = new_welcome
        
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

new_welcome_id = "Selamat datang di Mal Pelayanan Publik Simpurisiang Kabupaten Luwu.\n\nTabe', saya konsultan digital ta', Bapak/Ibu. Ada yang bisa saya bantukanki' hari ini? Jika ada pertanyaanta' mengenai jenis-jenis layanan, alur pelayanan, maupun persyaratan, silahkanki' bertanya langsung di sini. Kami hadir untuk memudahkan urusan Bapak/Ibu. Salama' Ki' To Pada Salama'."

update_json('src/locales/id.json', new_welcome_id)
