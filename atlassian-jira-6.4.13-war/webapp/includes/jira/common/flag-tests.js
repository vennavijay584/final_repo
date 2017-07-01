AJS.test.require("jira.webresources:messages");

(function () {
    'use strict';

    module('JIRA Flags', {
        setup: function () {
            this.auiFlagStub = sinon.stub();
            var ctx = AJS.test.context();
            ctx.mock('aui/flag', this.auiFlagStub);

            this.claimStub = sinon.stub(WRM.data, 'claim');
            this.claimStub.returns(undefined);

            this.contextPathStub = sinon.stub(AJS, 'contextPath');
            this.contextPathStub.returns('/context-path');

            this.server = sinon.fakeServer.create();
            this.server.respondWith([204, '', '']);

            this.flag = ctx.require('jira/flag');

            this.flagShown = function (type, title, body, expectedOptions) {
                var actualOptions = this.auiFlagStub.lastCall.args[0];
                expectedOptions = expectedOptions || {};
                expectedOptions.type = type;
                expectedOptions.title = title;
                expectedOptions.body = body;

                for (var key in expectedOptions) {
                    if (expectedOptions.hasOwnProperty(key)) {
                        equal(actualOptions[key], expectedOptions[key],
                                'correct value of "' + key + '" in options argument');
                    }
                }
            }
        },
        teardown: function () {
            this.claimStub.restore();
            this.server.restore();
            this.contextPathStub.restore();
        }
    });

    test('Calls aui.flag & sets correct defaults', function () {
        var title = 'Title',
                body = 'Body';
        this.flag.showMsg(title, body);
        this.flagShown('info', title, body);
    });

    test('Success message defaults to auto-close', function () {
        var title = 'Title';
        var body = 'Body';

        this.flag.showSuccessMsg(title, body);
        this.flagShown('success', title, body, {close: 'auto'});

        this.flag.showMsg(title, body, {type: 'success'});
        this.flagShown('success', title, body, {close: 'auto'});
    });

    test('Preserves explicitly-set close mode for success method', function () {
        var title = 'Title';
        var body = 'Body';

        this.flag.showSuccessMsg(title, body, {close: 'never'});
        this.flagShown('success', title, body, {close: 'never'});

        this.flag.showMsg(title, body, {type: 'success', close: 'never'});
        this.flagShown('success', title, body, {close: 'never'});
    });

    test('Uses Info, Success, Warning & Error types', function () {
        var title = 'Title';
        var body = 'Body';

        this.flag.showInfoMsg(title, body);
        this.flagShown('info', title, body);

        this.flag.showWarningMsg(title, body);
        this.flagShown('warning', title, body);

        this.flag.showErrorMsg(title, body);
        this.flagShown('error', title, body);

        // Success in options argument
        this.flag.showMsg(title, body, {type: 'success'});
        this.flagShown('success', title, body);
    });

    test('Does not show a dismissed flag', function () {
        this.claimStub.returns({ dismissed: ['i.was.dismissed'] });

        this.flag.showMsg('Title', 'Body', { dismissalKey: 'i.was.dismissed'});

        sinon.assert.notCalled(this.auiFlagStub);
    });

    test('PUTs a dismissal to the appropriate URL on close', function () {
        var flagElement = document.createElement('div');
        this.auiFlagStub.returns(flagElement); // return a dummy flag element

        this.flag.showMsg('Title', 'Body', { dismissalKey: 'was i dismissed?' });

        flagElement.dispatchEvent(new CustomEvent('aui-flag-close', { bubbles: true }));

        equal(this.server.requests.length, 1, 'One request was made');
        equal(this.server.requests[0].method, 'PUT', 'The dismissal request was PUT');
        equal(this.server.requests[0].url, '/context-path/rest/flags/1.0/flags/was%20i%20dismissed%3F/dismiss');
    });

    test('Does not store dismissal of a flag without a key', function () {
        var flagElement = document.createElement('div');
        this.auiFlagStub.returns(flagElement);

        this.flag.showMsg('Title', 'Body');

        flagElement.dispatchEvent(new CustomEvent('aui-flag-close', { bubbles: true }));

        equal(this.server.requests.length, 0, 'No requests were made.');
    });

    test('Does not show a flag that was just dismissed', function () {
        var flagElement = document.createElement('div');
        this.auiFlagStub.returns(flagElement);

        this.flag.showMsg('Title', 'Body', { dismissalKey: 'just.dismissed' });

        flagElement.dispatchEvent(new CustomEvent('aui-flag-close', { bubbles: true }));

        this.flag.showMsg('Title', 'Body', { dismissalKey: 'just.dismissed' });
        sinon.assert.calledOnce(this.auiFlagStub);
    });
})();
