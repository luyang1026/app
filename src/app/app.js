'use strict';
angular.module('app', ['ui.router', 'ui.bootstrap', 'ngAnimate', 'ngCookies', 'ly.login','ly.main','ly.subscriber.info','ly.account.balance','swalk.confirm'])
    .constant('config',{
        backendUrl:'http://172.16.1.224:8089'
    })
    .config(function($urlRouterProvider,$stateProvider){
        $urlRouterProvider.otherwise('/forum/login');
    	$stateProvider
    		.state('forum',{
    			url:'/forum',
    			abstract:true,
    			template:'<div ui-view class="view-main"></div>'
    		})
                .state('forum.login',{
                    url:'/login',
                    templateUrl:'app/modules/login/login.tpl.html',
                    controller:'forum.login.controller'
                })
        		.state('forum.main', {
        			url: '/main',
        			templateUrl: "app/modules/main/user.tpl.html"
        		})
            		//商户管理
                    .state('forum.main.subscriber',{
                        url:'/subscriber',
                        abstract:true
                    })
                		.state('forum.main.subscriber.info',{
                			url:'/info',
                			views:{
                				'mainContent@forum.main':{
                					templateUrl:'app/views/subscriber.info/subscriber.info.html',
                                    controller:'ly.subscriber.info.controller'
                				}
                			}
                		}) 
                    		.state('forum.main.subscriber.info.action',{
                    			url:'/action?action&id',
                    			views:{
                    				'mainContent@forum.main':{
                    					templateUrl:'app/views/subscriber.info/subscriber.info.action.html',
                    					controller:'ly.subscriber.info.action.controller'
                    				}
                    			}
                    		})
            		//对账结算
                    .state('forum.main.account',{
                        url:'/account',
                        abstract:true
                    })
                		.state('forum.main.account.balance',{
                			url:'/balance',
                			views:{
                				'mainContent@forum.main':{
                					templateUrl:'app/views/account.balance/account.balance.byChannel.html'
                				}
                			}
                		})
                            .state('forum.main.account.balance.detail',{
                                url:'/detail',
                                views:{
                                    'mainContent@forum.main':{
                                        templateUrl:'app/views/account.balance/account.balance.byChannel.detail.html'
                                    }
                                }
                            })
                            .state('forum.main.account.payment',{
                                url:'/payment',
                                views:{
                                    'mainContent@forum.main':{
                                        templateUrl:'app/views/account.payment/account.payment.query.html'
                                    }
                                }
                            })
                            .state('forum.main.account.statement',{
                                url:'/statement',
                                views:{
                                    'mainContent@forum.main':{
                                        templateUrl:'app/views/account.statement/account.statement.query.html'
                                    }
                                }
                            })
    })



;(function ($) {
    $.fn.datetimepicker.dates['zh-CN'] = {
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        daysMin: ["日", "一", "二", "三", "四", "五", "六"],
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        today: "今日",
        clear: "清除",
        meridiem: ['am', 'pm'],
        suffix: ['st', 'nd', 'rd', 'th'],
        format: "yyyy-mm-dd",
        titleFormat: "yyyy年mm月",
        weekStart: 1
    };
}(jQuery));