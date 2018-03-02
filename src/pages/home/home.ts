import { Component } from '@angular/core';
import { NavController, ActionSheetController, ToastController, Platform, LoadingController, Loading  } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { Transfer, TransferObject } from '@ionic-native/transfer';
import { FilePath } from '@ionic-native/file-path';
import { Camera } from '@ionic-native/camera';

declare var cordova: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  lastImage: string = null;
  loading: Loading;


  constructor(
    public navCtrl: NavController,
    private camera: Camera,
    private transfer: Transfer,
    private file: File,
    private filePath: FilePath,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private platform: Platform,
    private loadingCtrl: LoadingController) {

  }
  

  public presentActionSheet(){
    let actionSheet = this.actionSheetCtrl.create({ 
      title: 'Selecione',
      buttons: [
        {
        text:'Carregar da memória do telefone',
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
          }
        },
        {
          text:'Tirar uma foto',
          handler: () => {
          this.takePicture(this.camera.PictureSourceType.CAMERA);
          }
         } ,
        {
          text:'cancel',
          role: 'cancel'
        }
      ]
     });
     actionSheet.present();
  }

  public takePicture(sourceType){

    //cria opções

    var options = {
      quality: 100,
      sourceType: sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };


    //Pega as informações da camera pelo tipo 

    this.camera.getPicture(options).then((imagePath) => {
      //Se for plataforma andoid e se for para pegar o arquivo da biblioteca de imagens 
      if(this.platform.is('android') && sourceType === this.camera.PictureSourceType.PHOTOLIBRARY){
        this.filePath.resolveNativePath(imagePath)
        .then(filePath => {
          let correctPath = filePath.substr(0, filePath.lastIndexOf('/')+1);
          let currentName = imagePath.substring(imagePath.lastIndexOf('/')+1, imagePath.lastIndexOf('?'));
          this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
          
        });
      }else {
        var currentName = imagePath.substr(imagePath.lastIndexOf('/')+1);
        var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/')+1);
        this.copyFileToLocalDir(correctPath, currentName, this.createFileName());

      }
    }, (err) => {
      this.presentToast('Ocorreu um erro enquando selecionava a imagem');
    });


  }
 
  //Função que cria um novo nome para a imagem 
  private createFileName(){
    var d = new Date(),
    n = d.getTime(),
    newFileName = n + ".jpg";
    return newFileName;
  }

//Função Copia a imagem para o diretório local
  private copyFileToLocalDir(namePath, currentName, newFileName){
    this.file.copyFile(namePath, currentName, cordova.file.dataDirectory, newFileName)
    .then(success => {
      this.lastImage = newFileName;
      }, error => {
        this.presentToast('Erro enquanto armazenava o arquivo.');
        });

  }

  //Função de ocorreu um erro ou seja a mensagem de erro para o usuario, configuração da mensagem
  private presentToast(text){
    let toast = this.toastCtrl.create({
      message: text,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }

 

  private uploadImage(){
    //URL
    var url = "http://localhost/upload/upload.php";

    //Arquivo que vamos fazer o upload Upload

    var  targetPath = this.pathForImage(this.lastImage);

    //Nome do arquivo 

    var  filename = this.lastImage;

    var options = {
      fileKey: "false",
      fileName: filename,
      chunkedMode: false,
      mimeType: "multipart/form-data",
      params: { 'fileName': filename}
    };

    const fileTransfer: TransferObject = this.transfer.create();
    this.loading = this.loadingCtrl.create({
      content: 'Uploading...',
      });

    this.loading.present();

    //Utilize a FileTransfer para fazer upload da imagem 
    fileTransfer.upload(targetPath, url, options).then(data => {
      this.loading.dismissAll()
      this.presentToast('Imagem Carregada com sucesso.');
    }, err => {
      this.loading.dismissAll()
      this.presentToast('Erro enquanto carregava a imagem ');
    });
  }

  private pathForImage(img){

    if(img === null ){
      return '';
    }else{
      return cordova.file.dataDirectory + img;
    }

  }

}
