define('jira/ajs/select/multi-select/lozenge', [
    'jira/util/assistive',
    'jira/ajs/control',
//    'aui',
    'jquery'
], function(
    Assistive,
    Control,
//    AJS,
    jQuery
) {
    var ID = 0;
    var assistiveLabelId;

    /**
     * A lozenge represents a discrete item of user input as a <button> element that can be focused, blurred and removed.
     *
     * @class MultiSelect.Lozenge
     * @extends Control
     */
    return Control.extend({

        init: function(options) {
            this.id = ID;
            ID += 1;

            this._setOptions(options);

            this.$lozenge = this._render("lozenge");

            this.$removeButton = this._render("removeButton");
            this.$removeButton.tooltip();

            this._assignEvents("instance", this);
            this._assignEvents("lozenge", this.$lozenge);
            this._assignEvents("removeButton", this.$removeButton);

            this.$removeButton.appendTo(this.$lozenge);
            this.$lozenge.appendTo(this.options.container);
        },

        _getDefaultOptions: function() {
            return {
                label: null,
                title: null,
                container: null,
                focusClass: "focused"
            };
        },

        _renders: {
            "lozenge": function() {
                var label = AJS.escapeHtml(this.options.label);
                var title = AJS.escapeHtml(this.options.title) || "";
                if (!assistiveLabelId) {
                    assistiveLabelId = Assistive.createOrUpdateLabel(AJS.I18n.getText("common.concepts.remove.option.label"));
                }

                return jQuery('<li class="item-row" id="item-row-' + this.id + '" role="option" aria-describedby="'+ assistiveLabelId +'"><button type="button" tabindex="-1" class="value-item"><span><span class="value-text">' + label + '</span></span></button></li>');
            },
            "removeButton": function() {
                return jQuery('<em class="item-delete" aria-label=" "></em>');
            },
            "descriptionElement": function() {
                return jQuery("<div>Press delete or backspace to remove this option</div>");
            }
        },

        _events: {
            "instance": {
                "focus": function() {
                    this.$lozenge.addClass(this.options.focusClass);
                },
                "blur": function() {
                    this.$lozenge.removeClass(this.options.focusClass);
                },
                "remove": function() {
                    this.$lozenge.remove();
                }
            },
            "lozenge": {
                "click": function() {
                    this.trigger("focus");
                }
            },
            "removeButton": {
                "click": function() {
                    this.trigger("remove");
                }
            }
        }
    });

});

AJS.namespace('AJS.MultiSelect.Lozenge', null, require('jira/ajs/select/multi-select/lozenge'));
