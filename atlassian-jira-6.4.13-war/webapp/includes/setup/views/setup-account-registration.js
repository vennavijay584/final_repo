define("jira/setup/setup-account-registration-view", [
    "jquery",
    "backbone",
    "underscore",
    "jira/setup/setup-account-abstract-view",
    "jira/setup/setup-tracker"
], function ($, Backbone, _, AccountAbstractView, setupTracker) {

    return AccountAbstractView.extend({
        template: JIRA.Templates.Setup.Account.registrationForm,

        ui: {
            "fullname": "#jira-setup-account-field-fullname",
            "spinnerCreating": ".jira-setup-account-spinner-creating"
        },

        fields: {
            "fullname": {}
        },

        formType: "registration",
        _accountFailedAttempts: 0,
        _isRegistrationForm: true,
        _userCreated: false,

        ViewStateHandler: AccountAbstractView.prototype.ViewStateHandler.extend({
            awaitUserData: function () {
                AccountAbstractView.prototype.ViewStateHandler.prototype.awaitUserData.apply(this);

                this.view.ui.spinnerCreating.addClass("hidden");

                if (this.view._switchFormRecommended){
                    this.view.ui.descWrapper.removeClass("hidden");
                    this.view.ui.descEmailExisting.removeClass("hidden");
                } else if (this.view._switchFormRecommendedAfterSubmit){
                    this.view.ui.descWrapper.removeClass("hidden");
                    this.view.ui.descEmailExistingAfterSubmit.removeClass("hidden");
                }
            },
            awaitSubmitResult: function () {
                AccountAbstractView.prototype.ViewStateHandler.prototype.awaitSubmitResult.apply(this);

                this.view.ui.spinnerCreating.removeClass("hidden");
            },
            awaitLicenseGeneration: function() {
                AccountAbstractView.prototype.ViewStateHandler.prototype.awaitLicenseGeneration.apply(this);

                this.view.ui.spinnerCreating.addClass("hidden");
            }
        }),

        initialize: function (options) {
            this.macUtil = options.macUtil;
            this.setupTracker = _.isEmpty(options.setupTracker) ? setupTracker : options.setupTracker;
            this.templateHelpers.values.email = options.email;
            this.templateHelpers.values.password = options.password;

            this.fields.fullname.required = options.errorTexts.fullnameRequired;
        },

        onShow: function () {
            this.ui.fullname.focus();
            this.ui.fullname.val(this.ui.fullname.val());
        },

        doSubmit: function () {
            var values = this.getValues();

            if (this._userCreated) {
                this.handleLicenseGeneration();
            } else {
                this.ui.spinnerCreating.removeClass("hidden");

                this.macUtil.createUser(values)
                    .fail(_.bind(this.handleUserCreationFailure, this))
                    .fail(_.bind(function() {
                        this.validationStateMachine.submitFailure();
                    }, this))
                    .done(_.bind(function () {
                        this._userCreated = true;
                        this.validationStateMachine.submitSuccess();

                        this.setupTracker.sendUserCreatedEvent();
                        this.handleLicenseGeneration();
                    }, this));
            }
        },

        userExistenceConfirmed: function (exists) {
            this._switchFormRecommended = exists;
        },

        handleUserCreationFailure: function (response) {
            if (response.fieldErrors) {
                _.extend(this.templateHelpers.errors, {
                    "fullname": response.fieldErrors.displayName,
                    "email": response.fieldErrors.email,
                    "password": response.fieldErrors.password
                });

                if (this.macUtil.isUserAlreadyExistsErrorMessage(response.fieldErrors.email)){
                    this._switchFormRecommendedAfterSubmit = true;
                }
            } else {
                this._accountFailedAttempts++;

                this.templateHelpers.createAccountWarning = true;
                this.templateHelpers.createAccountWarningError = this._accountFailedAttempts >= 3;
            }

            this.render();
        }
    });
});