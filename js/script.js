var noteApiEndpoint = 'your-notes-api-endpoint-here';
var noteFilesApiEndpoint = 'your-files-api-endpoint-here';
var cognitoUserPoolId = 'cognito-user-pool-id';
var cognitoUserPoolClientId = 'cognito-client-id';
var cognitoIdentityPoolId = 'cognito-identity-pool-id';
var bucketName = 's3-files-bucket';
var awsRegion = 'region-here';

var gridScope;
var descriptionScope;
var filesScope;


function loggedInDisplay() {
    $("#signInButton").addClass("d-none");
    $("#signOutButton").removeClass("d-none");
}

function loggedOutDisplay() {
    $("#signInButton").removeClass("d-none");
    $("#signOutButton").addClass("d-none");
}

function initializeStorage() {
    var identityPoolId = cognitoIdentityPoolId;
    var userPoolId = cognitoUserPoolId; 
    var clientId = cognitoUserPoolClientId;
    var loginPrefix = 'cognito-idp.' + awsRegion + '.amazonaws.com/' + userPoolId;

    localStorage.setItem('identityPoolId', identityPoolId);
    localStorage.setItem('userPoolId', userPoolId);
    localStorage.setItem('clientId', clientId);
    localStorage.setItem('loginPrefix', loginPrefix);
}

function markFileDeleted(fileID) {
    $("#" + fileID).addClass("d-none");
}

function showAddFilesForm(){
    $("#addFilesForm").removeClass("d-none");
    $("#fileinput").replaceWith($("#fileinput").val('').clone(true));
    document.getElementById("showAddFilesButton").onclick = hideAddFilesForm;
    document.getElementById("showAddFilesButton").innerHTML = "Hide";
    } 
function hideAddFilesForm(){
    $("#addFilesForm").addClass("d-none");
    document.getElementById("showAddFilesButton").onclick = showAddFilesForm;
    document.getElementById("showAddFilesButton").innerHTML = `Add Files <img src="img/file.png" title="attachments" id="attachments-img"/>`;
} 
function showEditNote(){
    $("#editNoteForm").removeClass("d-none");
    // $("#fileinput").replaceWith($("#fileinput").val('').clone(true));
    document.getElementById("showEditNote").innerText = "Hide";
    document.getElementById("showEditNote").onclick = hideEditNote;
} 
function hideEditNote(){
    $("#editNoteForm").addClass("d-none");
    document.getElementById("showEditNote").innerText = "Edit Description";
    document.getElementById("showEditNote").onclick = showEditNote;
}  

function register() {
    event.preventDefault();

    var poolData = {
      UserPoolId : cognitoUserPoolId,
      ClientId : cognitoUserPoolClientId
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var attributeList = [];

    var email = document.getElementById('email').value;
    var pw = document.getElementById('pwd').value;
    var confirmPw = document.getElementById('confirmPwd').value;
    var dataEmail = {
        Name : 'email',
        Value : email
    };

    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    attributeList.push(attributeEmail);
    if (pw === confirmPw) {
        userPool.signUp(email, pw, attributeList, null, function(err, result){
            if (err) {
                alert(err.message);
                return;
            }
            cognitoUser = result.user;
            // console.log(cognitoUser);
            localStorage.setItem('email', email);
            window.location.replace('confirm.html');
      });
    } else {
        alert('Passwords do not match.')
    };
}

function confirmRegister(event) {
    event.preventDefault();

    var confirmCode = document.getElementById('confirmCode').value;

    var poolData = {
      UserPoolId : cognitoUserPoolId,
      ClientId : cognitoUserPoolClientId
    };

    var userName = localStorage.getItem('email');

    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username : userName,
        Pool : userPool
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(confirmCode, true, function(err, result) {
        if (err) {
            alert(err.message);
            return;
        }
        window.location.replace("index.html");
    });
}

function login(){
    var userPoolId = localStorage.getItem('userPoolId');
    var clientId = localStorage.getItem('clientId');
    var identityPoolId = localStorage.getItem('identityPoolId');
    var loginPrefix = localStorage.getItem('loginPrefix');

    AWSCognito.config.region = awsRegion;
    AWSCognito.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: identityPoolId // your identity pool id here
    }); 
    AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'})

    AWS.config.region = awsRegion; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: identityPoolId
    });

    var poolData = {
        UserPoolId : userPoolId, // Your user pool id here
        ClientId : clientId // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var username = $('#username').val();
    var password = $('#password').val();


    var authenticationData = {
        Username: username,
        Password: password
    };
    event.preventDefault();
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    var userData = {
        Username : username,
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    event.preventDefault();
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            var JwtToken = result.getAccessToken().getJwtToken();
            var accessToken = result.getAccessToken();
            var userid = accessToken["payload"]["username"];
            var IdToken = result.getIdToken().getJwtToken();
            // console.log('Authentication successful', accessToken);
            // console.log('FINALLYY username',userid);
            // console.log(JwtToken);
            // console.log("ID Token",IdToken);
            
            var sessionTokens =
            {
                IdToken: IdToken,
                AccessToken: result.getAccessToken(),
                RefreshToken: result.getRefreshToken()
            };
            localStorage.setItem('sessionTokens', JSON.stringify(sessionTokens))
            localStorage.setItem('userID', userid);
            localStorage.setItem('username', username);
            //localStorage.setItem('password', password);
            window.location = './home.html';
        },
        onFailure: function(err) {
            console.log('failed to authenticate');
            console.log(JSON.stringify(err));
            alert('Failed to Log in.\nPlease check your credentials.');
        },
    });
}

function refreshAWSCredentials() {
    var userPoolId = localStorage.getItem('userPoolId');
    var clientId = localStorage.getItem('clientId');
    var identityPoolId = localStorage.getItem('identityPoolId');
    var loginPrefix = localStorage.getItem('loginPrefix');

    var poolData = {
        UserPoolId : userPoolId, // Your user pool id here
        ClientId : clientId // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession(function(err, result) {
            if (result) {
                console.log('user exist');
                cognitoUser.refreshSession(result.getRefreshToken(), function(err, result) {
                    if (err) {//throw err;
                        console.log('Refresh AWS credentials failed ');
                        alert("You need to log back in");
                        window.location = './index.html';
                    }
                    else{
                        console.log('Logged in user');
                        localStorage.setItem('awsConfig', JSON.stringify(AWS.config));
                        var sessionTokens =
                        {
                            IdToken: result.getIdToken().getJwtToken(),
                            AccessToken: result.getAccessToken(),
                            RefreshToken: result.getRefreshToken()
                        };
                        localStorage.setItem("sessionTokens", JSON.stringify(sessionTokens));
                    }
                });
            }
            
        });
    }
}

//fuction to delete a note 
function deleteNote(noteID) {
    var userID = localStorage.getItem('userID');
    var noteApi = noteApiEndpoint + userID + '/notes/' + noteID + '/delete';

    var sessionTokensString = localStorage.getItem('sessionTokens');
    var sessionTokens = JSON.parse(sessionTokensString);
    var IdToken = sessionTokens.IdToken;

    $.ajax({
    url : noteApi,
    type : 'DELETE',
    headers : {'Authorization' : IdToken },
    success : function(response) {
        console.log('deleted note: ' + noteID);
        location.reload();
    },
    error : function(response) {
        console.log("could not delete note.");
        if (response.status == "401") {
        refreshAWSCredentials();
        }
    }
    });
}
  

function logOut() {
    localStorage.clear();
    document.location.reload();
    window.location = './index.html';
}
function loggedOutDisplay() {
    $("#signInButton").removeClass("d-none");
    $("#signOutButton").addClass("d-none");
    console.log("Completed loggedoutdisplay");
}
function displayFilesForm(){
    $("#FilesForm").removeClass("d-none");
    $("#fileadd").replaceWith($("#fileadd").val('').clone(true));
} 
function addNoteChangeFileName() {
    var file = document.getElementById('addNoteFileInput').files[0];
    var fileName = file.name;
    var fileSize = (file.size / 1024).toFixed(2);
    console.log(fileName);
    document.getElementById('fileName').innerHTML = fileName + " (" + fileSize + " KB)";
} 
function viewNoteChangeFileName() {
    // var fileName1 = document.getElementById('fileinput').files[0].name;
    var file1 = document.getElementById('fileInput').files[0];
    var fileName1 = file1.name;
    var fileSize1 = (file1.size / 1024).toFixed(2);
    console.log(fileName1);
    document.getElementById('fileName1').innerHTML = fileName1 + " (" + fileSize1 + " KB)";
    // console.log(fileName);
    // document.getElementById('fileName1').innerHTML = fileName1;
} 
function showNotes() {
    let noteElm1 = document.getElementById("notesDisplay");
    let html = "";

    try{
    var userID = localStorage.getItem('userID');
    var noteApi = noteApiEndpoint + userID +'/notes';
  
    var sessionTokensString = localStorage.getItem('sessionTokens');
    var sessionTokens = JSON.parse(sessionTokensString);
    var IdToken = sessionTokens.IdToken;
  
    $.ajax({
    url : noteApi,
    type : 'GET',
    headers : {'Authorization' : IdToken },
    success : function(response) {
        console.log("successfully loaded notes for " + userID);
        if("notes" in response) {
            notesList = response.notes;
        }
        else {
            notesList = [];
        }
        console.log("Accessing the array using the forEach loop:");
        console.log("Response Body !!!!!");
        notesList.forEach(function (item, index) {
                html += `<div class="card noteCard m-2 shadow-sm rounded-0" >
                <div class="card-body">
                <h5 class="card-title">${item.title} </h5>
                <div class="text-center">
                  <button id="editNoteButton" type="button" class="btn btn-sm" data-toggle="modal" data-target="#descriptionModal" data-noteid="` + item.noteID + `" onclick="fillNote('` + item.noteID + `');">Edit</button>
                <button id="deleteNoteButton" align="center" type="button" onclick="deleteNote('` + item.noteID + `')" class="btn btn-danger btn-sm">Delete</button>
                </div>
                </div>
                </div>`
                });
        noteElm1.innerHTML = html;   
        },
        error : function(response) {
            console.log("could not retrieve notes list.");
            console.log("Accessing the array using the forEach loop:");  
            if (response.status == "401") {
                refreshAWSCredentials();
            }
        }
        });
    }catch(err) {
        console.log(err.message);
        console.log("Error catch in showNotes");
        alert("You need to be signed in. Redirecting you to the sign in page!");
        console.log(err.message);
        loggedOutDisplay();
        }
}
function fillNote(noteID) {
    console.log("Into fillNote Function");
    var userID = localStorage.getItem('userID');
    var url = noteApiEndpoint + userID +'/notes/' + noteID;
    var fetchedNote = {};
  
    var sessionTokensString = localStorage.getItem('sessionTokens');
    var sessionTokens = JSON.parse(sessionTokensString);
    var IdToken = sessionTokens.IdToken;
    $.ajax({
        url : url,
        type : 'GET',
        async: false,
        headers : {'Authorization' : IdToken },
        success : function(response) {
            fetchedNote.title = response.title;
            fetchedNote.description = response.description;
            fetchedNote.dateCreated = response.dateCreated;
            fetchedNote.noteID = response.noteID;

            },
            error : function(response) {
                console.log("could not retrieve notes list.");
                console.log("Accessing the array using the forEach loop:");  
                if (response.status == "401") {
                    refreshAWSCredentials();
                }
            }
            });
    document.getElementById("noteTitle").innerHTML = fetchedNote.title;
    document.getElementById("noteDescription").innerHTML = fetchedNote.description;
    document.getElementById("noteDateCreated").innerHTML = fetchedNote.dateCreated;
    document.getElementById("noteTextarea").innerHTML = fetchedNote.description;
    document.getElementById("saveNoteButton").onclick = function () { updateNote(fetchedNote.noteID); };
    document.getElementById("deleteNoteButton").onclick = function () { deleteNote(fetchedNote.noteID); };
    document.getElementById("uploadButton").onclick = function () { addNoteFiles(fetchedNote.noteID, getNoteFiles); };

    getNoteFiles(fetchedNote.noteID);  
}      

function getNoteFiles(noteID) {
    console.log("Into getNoteFiles Function");
    var userID = localStorage.getItem('userID');
    var fetchedFiles = []
    var url = noteFilesApiEndpoint + noteID +'/file';
  
    var sessionTokensString = localStorage.getItem('sessionTokens');
    var sessionTokens = JSON.parse(sessionTokensString);
    var IdToken = sessionTokens.IdToken;
    $.ajax({
        url : url,
        type : 'GET',
        async: false,
        headers : {'Authorization' : IdToken },
        success : function(response) {
            if("files" in response) {
                console.log("Found files")
                fetchedFiles = fetchedFiles.concat(response.files);
            }
            },
            error : function(response) {
                console.log("could not retrieve notes list.");
                console.log("Accessing the array using the forEach loop:");  
                if (response.status == "401") {
                    refreshAWSCredentials();
                }
            }
            });

    let filesElm = document.getElementById('noteFilesGrid');
    let html = '';
    fetchedFiles.forEach(function (item, index) {
      html +=   `<div class="col-auto" id=` + item.fileID + `>
        <p align="center">
          <a href="` + item.filePath + `" target="_blank">` + item.fileName + `</a>
          <button id="deleteFileButton" align="center" type="button" onclick="deleteFile('` + item.noteID + `','` +  item.fileID + `', '` + item.filePath + `')" class="btn btn-outline-info btn-sm"><img src="img/cross.png" title="deleteFile" id="deleteFile-img"/></button>
        </p>
      </div>`
  });
    filesElm.innerHTML = html; 
  }
function deleteFile(noteID,fileID,filePath) {
    console.log('In deleteFile function');
    try{
        var api_url = noteFilesApiEndpoint  + noteID + '/file/' + fileID + '/delete' ;
        var sessionTokensString = localStorage.getItem('sessionTokens');
        var sessionTokens = JSON.parse(sessionTokensString);
        var IdToken = sessionTokens.IdToken;
    
        body = {
            'filePath': filePath
        };

        $.ajax({
        url : api_url,
        type : 'DELETE',
        headers : {'Content-Type': 'application/json','Authorization' : IdToken },
        dataType: 'json',
        data: JSON.stringify(body),
        success : function(response) {
            console.log("successfully deleted file " + fileID);
            getNoteFiles(noteID);
        },
        error : function(response) {
            console.log("could not delete file");
            if (response.status == "401") {
                refreshAWSCredentials();
            }
        }
        });
    }catch(err) {
        console.log(err.message);
    }
}
  

function addNote(event){
    event.preventDefault();
    $('#newNoteModal').modal('toggle');
    var title = document.getElementById('newNoteModalTitle').value;
    var description = document.getElementById('newNoteModalDescription').value;
    var userID = localStorage.getItem('userID');
    var addNoteURL = noteApiEndpoint + userID + "/notes/add";
  
    var sessionTokensString = localStorage.getItem('sessionTokens');
    var sessionTokens = JSON.parse(sessionTokensString);
    var IdToken = sessionTokens.IdToken;
  
    // var files = document.getElementById('addNoteFileInput').files;
    note = {
        title: title,
        description: description,
    }
    console.log("NOTE TO BE ADDED",note);
    $.ajax({
        url : addNoteURL,
        type : 'POST',
        async: false,
        headers : {'Content-Type': 'application/json', 'Authorization' : IdToken},
        dataType: 'json',
        data : JSON.stringify(note),
        success : function(response) {
            console.log("NOTE added!");
            var newNoteID = response["noteID"];
            console.log(newNoteID);
            // console.log(responseBody);
            // addNoteFiles(newNoteID, files, getNoteFiles);
            //get note id from response and call addNoteFiles(noteID, files, getNoteFiles);
            window.location.reload();
        },
        error : function(response) {
            console.log("could not add note");
            alert("Could not add note (x_x)");
        }
    });
  }

  function updateNote(noteID){
    console.log("In updateNote() function");
    $('#descriptionModal').modal('toggle');
    var description = document.getElementById('noteTextarea').value;
    var userID = localStorage.getItem('userID');
    var noteAPI = noteApiEndpoint + userID + "/notes/" + noteID + "/update";
  
    var sessionTokensString = localStorage.getItem('sessionTokens');
    var sessionTokens = JSON.parse(sessionTokensString);
    var IdToken = sessionTokens.IdToken;
    note = {
        "description": description
    }
  
    $.ajax({
        url : noteAPI,
        async : false,
        type : 'POST',
        headers : {'Content-Type': 'application/json', 'Authorization' : IdToken},
        dataType: 'json',
        data : JSON.stringify(note),
        success : function(response) {
            console.log("note updated!");
            // var responseBody = JSON.parse(response["body"]);
            window.location.reload();
        },
        error : function(response) {
            console.log("could not update note");
            alert("Could not update note (x_x)");
            console.log(response);
        }
    });
  }
  
  
  
  function addNoteFiles(noteID, callback) {
    var identityPoolId = localStorage.getItem('identityPoolId');
    var files = document.getElementById('fileInput').files;
    console.log("Adding file to S3");
  
    try{
        AWS.config.update({
            region: awsRegion,
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: identityPoolId
            })
        });
        var s3 = new AWS.S3({
            apiVersion: '2006-03-01',
            params: {Bucket: bucketName}
        });
        uploadNoteFileS3(noteID, s3, files, callback);
  
    }
    catch(err) {
        //alert("You must be logged in to add note attachment");
        console.log(err.message);
    }
  }
  
  
  
  function uploadNoteFileS3(noteID, bucket, filesToUp, callback){
    var userID = localStorage.getItem('userID');
    var noteFilesApi = noteFilesApiEndpoint + noteID + "/file/upload";

    var sessionTokensString = localStorage.getItem('sessionTokens');
    var sessionTokens = JSON.parse(sessionTokensString);
    var IdToken = sessionTokens.IdToken;
    
    if (!filesToUp.length) {
        alert("You need to choose a file to upload.");   
    }
    else{
        //var fileObj = new FormData();
        var file = filesToUp[0];
        var fileName = file.name;
        //var filePath = userID + '/' + noteID + '/' + fileName;
        //var fileUrl = 'https://' + bucketName + '.s3.amazonaws.com/' +  filePath;
        var fileKey = userID + '/' + noteID + '/' + fileName;
        var sizeInKB = file.size/1024;
        console.log('uploading a file of ' +  sizeInKB)
        if (sizeInKB > 2048) {
            alert("File size exceeds the limit of 2MB.");
        }
        else{
            var params = {
                Key: fileKey,
                Body: file,
                ACL: 'public-read',
                ContentType: file.type
            };
            bucket.upload(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    alert("Failed to upload file " + fileName);
                } else {
                    console.log(fileName + ' successfully uploaded for ' + noteID);
                    var fileObj = {
                        'fileName': fileName,
                        'filePath': fileKey
                    }
                    $.ajax({
                        url : noteFilesApi,
                        type : 'POST',
                        headers : {'Content-Type': 'application/json', 'Authorization' : IdToken },
                        contentType: 'json',
                        data: JSON.stringify(fileObj),
                        success : function(response) {
                            console.log("dynamodb table updated with filePath " + fileName);
                            callback(noteID);
                            
                        },
                        error : function(response) {
                            console.log("could not update dynamodb table: " + fileName);
                            if (response.status == "401") {
                                refreshAWSCredentials();
                            }
                        }
                    });
                    hideAddFilesForm();
                }
            })
        } 
    }    
  }