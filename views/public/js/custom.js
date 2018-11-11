(function ($) {
    "use strict";

    const mainApp = {
        mainFunc: function() {
            $(window).bind("load resize", function () {
                if ($(this).width() < 768) {
                    $('div.sidebar-collapse').addClass('collapse')
                } else {
                    $('div.sidebar-collapse').removeClass('collapse')
                }
            });
        },

        showLoader: function(callback) {
            $(".lds-roller").fadeIn(300, callback);
        },

        hideLoader: function(callback) {
            $(".lds-roller").fadeOut(300, callback);
        },

        pageMain: function() {
            $(".page-inner").fadeOut(300, function(){
                mainApp.showLoader();
            });

            const block = $("#main");
            $.get("/api/main", function(data){
                const str = 
                    "<b>Магазин:</b> " + data.name + "<br>" +
                    "<b>Сайт:</b> " + data.url + "<br>" + 
                    "<b>Описание:</b> " + data.text + "</br>" + 
                    "<b>Всего посещений: </b> " + data.users;

                const newHtml = block.html().replace("%data%", str);
                mainApp.hideLoader(function(){
                    block.html(newHtml).fadeIn(300);
                });
            });
        },

    }

    $(document).ready(function () {
        mainApp.mainFunc();
        mainApp.pageMain();
    });

}(jQuery));
