## Usar ficheiro proj.py para executar o codigo da camera.
## Os Outros Ficheiros são para teste 


# 1) Garante que tens o venv
sudo apt update
sudo apt install -y python3-venv python3-pip


# 2) Criar ambiente virtual
python3 -m venv venv

# 3) Ativar ambiente
source venv/bin/activate

# 4) Agora o pip aqui dentro já não é “externally managed”
pip install --upgrade pip
pip install supervision opencv-python numpy requests
