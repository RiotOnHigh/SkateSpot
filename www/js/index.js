var spotsDB = null;
var spotMarker;
var img;
var pictureSource; 
var destinationType;
var detailsWindow;
var spotMarkers = [];
var marker = [];
var newLatlng;
var curc = 0;

function initMapMarkers(map) {
    var markers = [];
    marker = marker;

    spotsDB.transaction(function(transaction) {
        transaction.executeSql('SELECT * FROM spots', [], function(tx, results) {
            var length = results.rows.length;
            var i;

            for (i = 0; i < length; i++) {
                var id = results.rows.item(i).id;
                var name = results.rows.item(i).name;
                var description = results.rows.item(i).description;
                var lat = results.rows.item(i).lat;
                var long = results.rows.item(i).long;
                var image = results.rows.item(i).image;
                var user = results.rows.item(i).user;
                var tag = results.rows.item(i).tag;

                var icon = new Icon(id, name, description, lat, long, image, user, tag);
                marker.push(icon);
            }

            for (var i in marker) {

                detailsWindow = new google.maps.InfoWindow;

                var j = i;

                var spotDetailsString = "" +
                    " <div class=\"row text-center\">" +
                    "<div class=\"thumbnail\">" +
                    " <strong><h3>" + marker[i].name + "</h3></strong>" +
                    " <img src='" + marker[i].img + "' alt='img' width='200px' height='120px'/>" +
                    " <p>Description: " + marker[i].description + "</p>" +
                    " <p>User: " + marker[i].user + "</p>" +
                    " <p>Tag: " + marker[i].tag + "</p>" +
                    "<div class=\"form-group\"><input type='button' value='Delete' onclick='deleteRow("+marker[i].id+")' class='btn btn-primary btn-block'/>" +
                    "</div>" +
                    " </div>";

                var latLong = new google.maps.LatLng(marker[i].lat, marker[i].lng);

                spotMarkers[marker[i].id] = new google.maps.Marker({
                    position: latLong,
                    map: map,
                    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    animation: google.maps.Animation.DROP
                });
                bindInfoWindow(spotMarkers[marker[i].id], map, detailsWindow, spotDetailsString);

            }
        }, errorspotDB);
    });
}

function bindInfoWindow(spotMarker, map, infoWindow, html) {
    google.maps.event.addListener(spotMarker, 'click', function() {
        infoWindow.setContent(html);
        infoWindow.open(map, spotMarker);
    });
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {

        pictureSource = navigator.camera.PictureSourceType;
        destinationType = navigator.camera.DestinationType;


        spotsDB = window.openDatabase("spots", "1.0", "spots", 1000000);

        spotsDB.transaction(function(transaction) {
            //transaction.executeSql('DROP TABLE IF EXISTS spots');
            transaction.executeSql('CREATE TABLE IF NOT EXISTS spots (id integer primary key, name text, description text, lat real, long real, image blob, user text, tag text)', [],

                function(tx, result) {
                    console.log("Table 'spots' created successfully");
                },

                function(error) {
                    console.log("Error occurred while creating the table. " + error);
                });
        });

        //Get the user's current location
        navigator.geolocation.getCurrentPosition(app.onSuccess, app.onError, {maximumAge:600000, timeout:5000, enableHighAccuracy: true});

    },

    onSuccess: function(position) {

        var lng = position.coords.longitude;
        var lat = position.coords.latitude;
        var latLong = new google.maps.LatLng(lat, lng);

        var mapStyle = [{
            featureType: "administrative",
            elementType: "labels",
            stylers: [{
                visibility: "off"
            }]
        }, {
            featureType: "poi",
            elementType: "labels",
            stylers: [{
                visibility: "off"
            }]
        }, {
            featureType: "water",
            elementType: "labels",
            stylers: [{
                visibility: "off"
            }]
        }, {
            featureType: "road",
            elementType: "labels",
            stylers: [{
                visibility: "off"
            }]
        }];

        var mapOptions = {
            center: latLong,
            zoom: 13,
            disableDefaultUI: true,
            styles: mapStyle,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var map = new google.maps.Map(document.getElementById("map"), mapOptions);

        spotMarker = new google.maps.Marker({
            position: latLong,
            map: map,
            title: 'currentlocation',
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });

        var infowindow = new google.maps.InfoWindow({
            content: "" +
            "<div id=\"form\" class=\"col-md-12\">" +
            "<form id='addSpot'>" +
            "<div class=\"form-group\"><label for=\"spotName\">Name:</label><input type='text' id='spotName' class='form-control' required/></div><br/>" +
            "<div class=\"form-group\"><label maxlength=\"50\" for=\"spotDescription\">Description:</label><textarea type='text' id='spotDescription' class='form-control' required></textarea></div>" +
            "<br/><div class=\"form-group\"><input type='button' value='Take Picture' onclick='capturePhoto()' class='btn btn-primary btn-block'/></div>" +
            "<div class=\"form-group\"><input type='button' value='Choose From Gallery' onclick='getPhoto();' class='btn btn-primary btn-block'</div>" +
            "<div class=\"form-group\"><label for=\"spotUser\">User:</label><input type='text' id='spotUser' class='form-control' required/> </div>" +
            "<div class=\"form-group\"><label for=\"spotTag\">Tag:</label><input type='text' id='spotTag' class='form-control' required/> </div>" +
            "<br/>" +
            "<div class=\"form-group\"><input type='button' value='Save' onclick='saveData()' class='btn btn-primary btn-block'/>" +
            "</form>" +
            "</div>"
        });


        google.maps.event.addListener(map, 'dblclick', function(event) {
            spotMarker = new google.maps.Marker({
                position: event.latLng,
                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                map: map,
            });
            infowindow.open(map, spotMarker);
        });

        //add markers to the map from storage
        initMapMarkers(map);
    },

    onError: function(error) {
        alert("the code is " + error.code + ". \n" + "message: " + error.message);
    },
};

function Icon(id, name, description, lat, lng, img, user, tag) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.lat = lat;
    this.lng = lng;
    this.img = img;
    this.user = user;
    this.tag = tag;
}

function saveData() {
    var id = null;
    var name = document.getElementById("spotName").value;
    var description = document.getElementById("spotDescription").value;
    var latlong = spotMarker.position;
    var imgSrc = img;
    var user = document.getElementById("spotUser").value;
    var tag = document.getElementById("spotTag").value;

    var icon = new Icon(id, name, description, latlong.lat(), latlong.lng(), imgSrc, user, tag);

    spotsDB.transaction(function(tx) {
        var executeQuery = "INSERT INTO spots (name, description, lat, long, image, user, tag) VALUES (?,?,?,?,?,?,?)";
        tx.executeSql(executeQuery, [icon.name, icon.description, icon.lat, icon.lng, icon.img, icon.user, icon.tag], successspotDB, errorspotDB);
    });

    spotMarker = null;
}

function deleteRow(db) {
    if (spotsDB) {
        spotsDB.transaction(function(t) {
            t.executeSql("DELETE FROM spots WHERE id=?", [db], successspotDelete);
        });
    } else {
        alert("db not found, your browser does not support web sql!");
    }
}

function successspotDB() {
    location.reload(true);
    alert("Spot added");
}

function errorspotDB(transaction, err) {
    console.log(err.message);
}

function successspotDelete() {
    location.reload(true);
    alert("Spot Deleted");
}

function onPictureFail(message) {
    alert('Failed because: ' + message);
}

function onPhotoDataSuccess(imageData) {
    img = "data:image/jpeg;base64," + imageData;
}

function capturePhoto() {
    navigator.camera.getPicture(onPhotoDataSuccess, onPictureFail, {
        quality: 70,
        destinationType: destinationType.DATA_URL
    });
}

function getPhoto() {
    navigator.camera.getPicture(onPhotoDataSuccess, onPictureFail, {
        quality: 70,
        destinationType: destinationType.DATA_URL,
        sourceType: pictureSource.PHOTOLIBRARY
    });
}

app.initialize();
