var avrsim = {
    timer: false,
    leds: [],
    btns: [],
    ports: ["L", "K", "J", "H", "G", "F", "E", "D", "C", "B", "A"],
    init_ports: function() {
        var self = this;
        this.ports.forEach(function(val) {
            var lobj = [];
            var bobj = [];

            for(var i = 7; i >= 0; i--) {
                lobj.push("P" + val + i);
                bobj.push("P" + val + i);
            }

            self.leds.push(lobj);
            self.btns.push(bobj);
        });
    },
    init: function() {
        nunjucks.configure({autoescape: true});

        this.init_ports();
        this.render();
    },
    run: function(name) {
        var initf =  Module.cwrap('init', 'void', ['string']);

        console.log(name);
        initf(name);
        this.timer = window.setInterval(function() {
            Module._run();
        }, 20);
    },
    create_file: function(data) {
        // data:;base64,
	dat = data;
	var dat = dat.substring(dat.indexOf(",") + 1);
	dat = atob(dat);

        console.log("creating file");
        var name = "f-" +  Math.floor(Date.now() / 1000) + ".hex";

        FS.createDataFile("/", name, dat, true, false);
        console.log("running");
        this.run(name);
    },
    handle_load: function() {
        if(this.timer != false)
            window.clearInterval(this.timer);
    
        this.timer = false;

        var files = $("#file-sel").get(0).files;
        var self = this;
        var output = [];
        for (var i = 0, file; file = files[i]; i++) {
            var reader = new FileReader();

            reader.onload = function(event) {
                var data = event.target.result;
                self.create_file(data);
            };

            reader.readAsDataURL(file);
        }
    },
    register_btn_handlers: function() {
        this.btns.forEach(function(val) {
            val.forEach(function(ival) {
                var elem = $("#btn-" + ival);
                elem.click(function() {

                    var port = ival.substring(1, 2);
                    var pin = ival.substring(2, 3);
                    var val;

                    console.log(port);

                    if(elem.hasClass("darken-2")) {
                        val = 1;
                        elem.removeClass("darken-2");
                        elem.addClass("darken-4");
                    } else {
                        val = 0;
                        elem.removeClass("darken-4");
                        elem.addClass("darken-2");
                    }

                    Module._set_pin(port.charCodeAt(0), pin, val);
                });
            });
        });
    },
    render: function() {
        var self = this;
        nunjucks.render("tpl/leds.html", { leds: this.leds }, function(err, res) {
            console.log(err);
            $('#leds').append(res);
        });

        nunjucks.render("tpl/btns.html", { btns: this.btns }, function(err, res) {
            console.log(err);
            $('#btns').append(res);
            self.register_btn_handlers();
        });

    }
};

avrsim.init();

var Module = {
     arguments: ["-v", "--menu"],
     preRun: [],
     postRun: [],
     print: (function() {
         return function(text) {
            $(".mcu-terminal").append("<li>" + text + "</li>");
         };
     })(),
     printErr: function(text) {
	 $(".mcu-terminal").append("<li>" + text + "</li>");
         console.log(text);
     },
     totalDependencies: 0,
 };

function pin_changed(port, pin, val) {
    $("#led-P" + String.fromCharCode(port) + pin).removeClass("grey");
    $("#led-P" + String.fromCharCode(port) + pin).removeClass("red");

    if(val == 1) {
        $("#led-P" + String.fromCharCode(port) + pin).addClass("red");
    } else {
        $("#led-P" + String.fromCharCode(port) + pin).addClass("grey");
    }
}

$(document).ready(function() {
    $('.modal-trigger').leanModal({
        complete: function() {
            avrsim.handle_load();
        }
    });
//    Module._init();

});
