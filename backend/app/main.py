import torch 
from torchvision import transforms
from PIL import Image
import torch.nn as nn
from flask import Flask, request, jsonify 
from flask_cors import CORS


def carregar_modelo ():
    model = nn.Sequential(
        nn.Conv2d(3, 32, 3, 1, 1), nn.ReLU() , nn.MaxPool2d(2),
        nn.Conv2d(32, 64, 3, 1, 1), nn.ReLU() , nn.MaxPool2d(2),
        nn.Conv2d(64, 128, 3, 1, 1), nn.ReLU() , nn.MaxPool2d(2),
        nn.Flatten(),
        nn.Linear(128 *16 *16, 256) , nn.ReLU() , nn.Dropout(0.5),
        nn.Linear(256,4))
 
    model.load_state_dict(torch.load('modelo_brain-tumor.pth', map_location=torch.device('cpu')))
    model.eval()
    return model

# conveter a img 
def converter_img(user_img):
    img = Image.open(user_img).convert('L').convert('RGB') 

    tf =transforms.Compose([
        transforms.Resize((128,128)),# Redimensiona a imagem para  128x128 pixels
        transforms.ToTensor(), #Converte a imagem para um Tensor do PyTorch
        transforms.Normalize([0.5 ,0.5 ,0.5],[0.5 ,0.5 ,0.5]) #cores (cinza)
    ])
    return tf(img).unsqueeze(0)


# conectando front end 

app = Flask(__name__)
CORS(app)
# carregar o modelo

modelo = carregar_modelo()

@app.route("/classificar" ,  methods=["POST"])


def classificar():
    NAME_CLASS = ['Glioma', 'Meningioma', 'Sem Tumor', 'Pituitário']

    arquivo = request.files['imagem']

    image = converter_img(arquivo)

    with torch.no_grad():
        output = modelo(image)

    probabilidade = torch.nn.functional.softmax(output , dim =1)


    maior_probabilidade,top_id = torch.max(probabilidade ,dim=1)

    probabilidade_list = probabilidade[0].tolist()

    indice_predito = top_id.item() 

    acuracia = round(maior_probabilidade.item() * 100,2)
    resultado_final = NAME_CLASS[indice_predito]
    
    return jsonify({
        "classe": resultado_final,
        "acuracia": acuracia,
        "probabilidades": [
    {
        "name": "Glioma",
        "confidence": round(probabilidade_list[0] * 100, 2),
        "color": "#ff0404"
    },
    {
        "name": "Meningioma",
        "confidence": round(probabilidade_list[1] * 100, 2),
        "color": "#fb6d08"
    },
    {
        "name": "Sem Tumor",
        "confidence": round(probabilidade_list[2] * 100, 2),
        "color": "#22c55e"
    },
    {
        "name": "Pituitário",
        "confidence": round(probabilidade_list[3] * 100, 2),
        "color": "#f5fd0f"
    }]
    })

if __name__ == "__main__":
    app.run(debug=True)