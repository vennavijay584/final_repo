define("jira/setup/setup-product-bundle-view", [
    "jquery",
    "backbone",
    "underscore",
    "jira/setup/setup-abstract-view"
], function($, Backbone, _, AbstractView){

    return AbstractView.extend({
        onSubmit: function(){
            this.ui.submitButton.enable(false);
        }
    });
});