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
            $(".page-inner").hide();
            mainApp.showLoader();

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

        pageStats: function() {
            mainApp.hideLoader();
            $(".page-inner").hide();
            $("#stats").fadeIn(300);
            
            let from = "2018-09-01";
            let to = "2018-09-30";
            getStats(from, to);
            
            $('input[name="daterange"]').daterangepicker({}, function(start, end){
                from = start.format('YYYY-MM-DD');
                to = end.format('YYYY-MM-DD')
            });

            $("#get-stats").click(function(){
                $("#stats .chart").empty().hide();
                $("#stats .panel-footer span").empty();
                $("#stats .panel-body .chart-load").show();

                getStats(from, to);
            });

            function getStats(_from, _to){
                $.get("/api/traffic?from=" + _from + "&to=" + _to, function(data){
                    $("#traffic").parent().find(".chart-load").hide();

                    $("#traffic").show().highcharts({
                        chart: { type: 'spline', height: "350" },
                        title: { text: '' },
                        xAxis: {
                            type: 'category',
                            categories: Object.keys(data),
                            crosshair: true
                        },
                        yAxis: {
                            min: 0,
                            title: {
                                text: 'Просмотры, шт'
                            }
                        },
                        tooltip: {
                            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                                '<td style="padding:0"><b>{point.y}</b></td></tr>',
                            footerFormat: '</table>',
                            shared: true,
                            useHTML: true
                        },
                        series: [{
                            name: 'Всего',
                            data: Object.keys(data).map(k => { return [k, data[k]] }),
                            type: 'spline',
                        }],
                        plotOptions: {
                            column: {
                                stacking: 'normal',
                            },
                            series: {
                                color: '#175c98'
                            }
                        },
                        credits: { enabled: false }
                    });
                });

                $.get("/api/conversion?from=" + _from + "&to=" + _to, function(data){
                    $("#conv").parent().find(".chart-load").hide();

                    $("#conv").show().highcharts({
                        chart: {
                            type: 'pie',
                            height: "350",
                        },
                        title: { text: '' },
                        tooltip: {
                            headerFormat: '',
                            pointFormat: '{point.name}: {point.y}%',
                            shared: true,
                            useHTML: true
                        },
                        series: [{
                            innerSize: '40%',
                            data: data
                        }],
                        plotOptions: {
                            pie: {
                                size: '70%',
                                dataLabels: {
                                    enabled: true,
                                    distance: 5,
                                    style: {
                                        fontSize: '14px',
                                        color: 'black'
                                    }
                                },
                                colors: ['#428bca', '#5bc0de', '#5cb85c'],
                            }
                        },
                        credits: { enabled: false }
                    });
                });

                $.get("/api/revenue?from=" + _from + "&to=" + _to, function(data){
                    $("#revenue").parent().find(".chart-load").hide();

                    $("#revenue-sum").text(Object.values(data).reduce(function(sum, curr){
                        return sum + curr
                    }, 0));
                    $("#revenue").show().highcharts({
                        chart: { type: 'spline', height: "350" },
                        title: { text: '' },
                        xAxis: {
                            type: 'category',
                            categories: Object.keys(data),
                            crosshair: true
                        },
                        yAxis: {
                            min: 0,
                            title: {
                                text: 'Выручка'
                            }
                        },
                        tooltip: {
                            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                                '<td style="padding:0"><b>{point.y}</b></td></tr>',
                            footerFormat: '</table>',
                            shared: true,
                            useHTML: true
                        },
                        series: [{
                            name: 'Всего',
                            data: Object.keys(data).map(k => { return [k, data[k]] }),
                            type: 'spline',
                        }],
                        plotOptions: {
                            column: {
                                stacking: 'normal',
                            },
                            series: {
                                color: '#175c98'
                            }
                        },
                        credits: { enabled: false }
                    });
                });

                $.get("/api/acost?from=" + _from + "&to=" + _to, function(data){
                    $("#acost").parent().find(".chart-load").hide();

                    $("#acost-sum").text(Math.round(Object.values(data).reduce(function(sum, curr){
                        return sum + Math.round(curr)
                    }, 0) / Object.keys(data).length));
                    $("#acost").show().highcharts({
                        chart: { type: 'spline', height: "350" },
                        title: { text: '' },
                        xAxis: {
                            type: 'category',
                            categories: Object.keys(data),
                            crosshair: true
                        },
                        yAxis: {
                            min: 0,
                            title: {
                                text: 'Стоимость'
                            }
                        },
                        tooltip: {
                            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                                '<td style="padding:0"><b>{point.y:,.0f}</b></td></tr>',
                            footerFormat: '</table>',
                            shared: true,
                            useHTML: true
                        },
                        series: [{
                            name: 'Средняя стоимость товара',
                            data: Object.keys(data).map(k => { return [k, data[k]] }),
                            type: 'spline',
                        }],
                        plotOptions: {
                            column: {
                                stacking: 'normal',
                            },
                            series: {
                                color: '#175c98'
                            }
                        },
                        credits: { enabled: false }
                    });
                });

                $.get("/api/arevenue?from=" + _from + "&to=" + _to, function(data){
                    $("#arpu").parent().find(".chart-load").hide();

                    $("#arpu-sum").text(Math.round(Object.values(data).reduce(function(sum, curr){
                        return sum + Math.round(curr)
                    }, 0) / Object.keys(data).length));
                    $("#arpu").show().highcharts({
                        chart: { type: 'spline', height: "350" },
                        title: { text: '' },
                        xAxis: {
                            type: 'category',
                            categories: Object.keys(data),
                            crosshair: true
                        },
                        yAxis: {
                            min: 0,
                            title: {
                                text: 'Выручка'
                            }
                        },
                        tooltip: {
                            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                                '<td style="padding:0"><b>{point.y:,.0f}</b></td></tr>',
                            footerFormat: '</table>',
                            shared: true,
                            useHTML: true
                        },
                        series: [{
                            name: 'Ср. чек',
                            data: Object.keys(data).map(k => { return [k, data[k]] }),
                            type: 'spline',
                        }],
                        plotOptions: {
                            column: {
                                stacking: 'normal',
                            },
                            series: {
                                color: '#175c98'
                            }
                        },
                        credits: { enabled: false }
                    });
                });

                $.get("/api/apay?from=" + _from + "&to=" + _to, function(data){
                    $("#arppu").parent().find(".chart-load").hide();

                    $("#arppu-sum").text(Math.round(Object.values(data).reduce(function(sum, curr){
                        return sum + Math.round(curr)
                    }, 0) / Object.keys(data).length));
                    $("#arppu").show().highcharts({
                        chart: { type: 'spline', height: "350" },
                        title: { text: '' },
                        xAxis: {
                            type: 'category',
                            categories: Object.keys(data),
                            crosshair: true
                        },
                        yAxis: {
                            min: 0,
                            title: {
                                text: 'Средний чек'
                            }
                        },
                        tooltip: {
                            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                                '<td style="padding:0"><b>{point.y:,.0f}</b></td></tr>',
                            footerFormat: '</table>',
                            shared: true,
                            useHTML: true
                        },
                        series: [{
                            name: 'С клиента',
                            data: Object.keys(data).map(k => { return [k, data[k]] }),
                            type: 'spline',
                        }],
                        plotOptions: {
                            column: {
                                stacking: 'normal',
                            },
                            series: {
                                color: '#175c98'
                            }
                        },
                        credits: { enabled: false }
                    });
                });
            }
        },

    }

    $(document).ready(function () {
        mainApp.mainFunc();
        mainApp.pageMain();

        $("[data-block]").click(function(){
            const blockName = $(this).data("block");

            switch (blockName) {
                case "main":
                    mainApp.pageMain();
                    break;
                case "stats":
                    mainApp.pageStats();
                    break;

                default:
                    return;
            }

            $(".active-link").removeClass("active-link");
            $(this).parent().addClass("active-link");
        });
    });

}(jQuery));
