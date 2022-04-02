"use strict";
let window_onpopstate = function (event) {
    history.pushState(null, null, null);
};
let document_onready = function (event) {
    history.pushState(null, null, null);
    $(window).on("popstate", window_onpopstate);
};
$(document).ready(document_onready);
