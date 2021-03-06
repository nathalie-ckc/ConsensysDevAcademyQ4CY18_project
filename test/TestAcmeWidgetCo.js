//const Web3 = require('web3');
const Web3 = require('web3');
const web3 = new Web3('ws://localhost:8546');
const truffleAssert = require('truffle-assertions');
const AcmeWidgetCo = artifacts.require('AcmeWidgetCo');

contract('AcmeWidgetCo', function(accounts) {

    const deployer = accounts[0];
    const admin1 = accounts[1];
    const tester1 = accounts[2];
    const salesdist1 = accounts[3];
    const customer1 = accounts[4];
    const customer2 = accounts[5];

    // From https://ethereum.stackexchange.com/questions/48627/how-to-catch-revert-error-in-truffle-test-javascript
    const catchRevert = require("./exceptions.js").catchRevert;

    // Why did I write each test?
    // You can look up all the "Testing" tasks in https://github.com/nathalie-ckc/ConsensysDevAcademyQ4CY18_project/issues?utf8=%E2%9C%93&q=is%3Aissue+%22Testing%3A%22
    // For every feature implemented, I made a test for it at the same time.

    // Make sure the first Admin is assigned in the constructor, otherwise
    // wouldn't be able to interact with the contract.
    it("accounts[0] (deployer) should be an admin", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const role = await acmeWidgetCo.addr2Role(deployer);
        assert.equal(role, 1, 'accounts[0] (deployer) is not an admin.');
	  })

    // Only the registered accounts can update state of the contract
    // so, test that we can add them.
    it("Test adding admin, tester, salesdist, customers", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const tx = await acmeWidgetCo.registerAdmin(admin1, {from: deployer});
        truffleAssert.eventEmitted(tx, 'NewAdmin', (ev) => {
          return ev._newAdminRegistered === admin1;
        });
        const role = await acmeWidgetCo.addr2Role(admin1);
        assert.equal(role, 1, 'accounts[1] (admin1) is not an admin.');

        const tx1 = await acmeWidgetCo.registerTester(tester1, {from: admin1});
        truffleAssert.eventEmitted(tx1, 'NewTester', (ev) => {
          return ev._newTesterRegistered === tester1;
        });
        const role1 = await acmeWidgetCo.addr2Role(tester1);
        assert.equal(role1, 2, 'admin1 could not register tester1 as a Tester.');

        const tx2 = await acmeWidgetCo.registerSalesDistributor(salesdist1, {from: admin1});
        truffleAssert.eventEmitted(tx2, 'NewSalesDistributor', (ev) => {
          return ev._newSalesDistributorRegistered === salesdist1;
        });
        const role2 = await acmeWidgetCo.addr2Role(salesdist1);
        assert.equal(role2, 3, 'admin1 could not register salesdist1 as a Sales Distributor.');

        const tx3 = await acmeWidgetCo.registerCustomer(customer1, {from: admin1});
        truffleAssert.eventEmitted(tx3, 'NewCustomer', (ev) => {
          return ev._newCustomerRegistered === customer1;
        });
        const role3 = await acmeWidgetCo.addr2Role(customer1);
        assert.equal(role3, 4, 'admin1 could not register customer1 as a Customer.');

        const tx4 = await acmeWidgetCo.registerCustomer(customer2, {from: admin1});
        truffleAssert.eventEmitted(tx4, 'NewCustomer', (ev) => {
          return ev._newCustomerRegistered === customer2;
        });
        const role4 = await acmeWidgetCo.addr2Role(customer2);
        assert.equal(role4, 4, 'admin1 could not register customer2 as a Customer.');
    })

    // To limit power, only allow each account to have 1 role and only that role
    it("Test that a registered account can't be registered again.", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        await catchRevert(acmeWidgetCo.registerTester(tester1, {from: admin1}));
    })

    // Need a list of factories & test sites for the tester to choose from later
    it("Test admin populating list of factories and test sites", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const tx9 = await acmeWidgetCo.addFactory("Factory1 Shanghai", {from: admin1});
        truffleAssert.eventEmitted(tx9, 'NewFactory', (ev) => {
          return ev._factoryCount == 1 && ev._factory === "Factory1 Shanghai";
          // HACK: Not sure why === 1 doesn't work, but had to use == 1.
        });
        const fact1Position = await acmeWidgetCo.factoryMapping(web3.utils.soliditySha3("Factory1 Shanghai"));
        assert.equal(fact1Position.toNumber(), 0, 'Factory1 Shanghai is not in the list.');

        const tx1 = await acmeWidgetCo.addFactory("Factory2 Taipei", {from: admin1});
        truffleAssert.eventEmitted(tx1, 'NewFactory', (ev) => {
          return ((ev._factoryCount == 2) && (ev._factory === "Factory2 Taipei"));
        });
        const fact2Position = await acmeWidgetCo.factoryMapping(web3.utils.soliditySha3("Factory2 Taipei"));
        assert.equal(fact2Position.toNumber(), 1, 'Factory2 Taipei is not in the list.');

        const tx2 = await acmeWidgetCo.addTestSite("TS1 Singapore", {from: admin1});
        truffleAssert.eventEmitted(tx2, 'NewTestSite', (ev) => {
          return ((ev._testSiteCount == 1) && (ev._testSite === "TS1 Singapore"));
        });
        const ts1Position = await acmeWidgetCo.testSiteMapping(web3.utils.soliditySha3("TS1 Singapore"));
        assert.equal(ts1Position.toNumber(), 0, 'TS1 Singapore is not in the list.');

        const tx3 = await acmeWidgetCo.addTestSite("TS2 Osaka", {from: admin1});
        truffleAssert.eventEmitted(tx3, 'NewTestSite', (ev) => {
          return ((ev._testSiteCount == 2) && (ev._testSite === "TS2 Osaka"));
        });
        const ts2Position = await acmeWidgetCo.testSiteMapping(web3.utils.soliditySha3("TS2 Osaka"));
        assert.equal(ts2Position.toNumber(), 1, 'TS2 Osaka is not in the list.');
    })

    // Need widgets documented in the system so that they can be later binned & bought
    it("Test tester recording widget result", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const tx = await acmeWidgetCo.recordWidgetTests(1234001, 1, 1, 0xFFFFFFFF, {from: tester1});
        truffleAssert.eventEmitted(tx, 'NewTestedWidget', (ev) => {
          return ((ev._serial == 1234001) &&
            (ev._factory == 1) &&
            (ev._testSite == 1) &&
            (ev._results == 0xFFFFFFFF) &&
            (ev._widgetCount == 1) &&
            (ev._bin == 1) &&
            (ev._binCount == 1)
          );
        });
        const widget1 = await acmeWidgetCo.widgetList(0);
        assert.equal(widget1[0], 1234001, 'Widget1 incorrect serial number.');
        assert.equal(widget1[1], 1, 'Widget1 incorrect factory.');
        assert.equal(widget1[2], 1, 'Widget1 incorrect test site.');
        assert.equal(widget1[3], 0xFFFFFFFF, 'Widget1 incorrect recorded test result.');
    })

    // Make sure that we can still add more test sites later on & the updates will be reflected
    it("Test that additional factory and test sites are usable", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const tx = await acmeWidgetCo.addFactory("Factory3 Delhi", {from: deployer});
        const fact3Position = await acmeWidgetCo.factoryMapping(web3.utils.soliditySha3("Factory3 Delhi"));
        assert.equal(fact3Position.toNumber(), 2, 'Factory3 Delhi is not in the list.');

        const tx1 = await acmeWidgetCo.addTestSite("TS3 Austin", {from: deployer});
        const ts3Position = await acmeWidgetCo.testSiteMapping(web3.utils.soliditySha3("TS3 Austin"));
        assert.equal(ts3Position.toNumber(), 2, 'TS3 is not in the list.');

        const tx2 = await acmeWidgetCo.recordWidgetTests(1234002, 2, 2, 0xFFFF1234, {from: tester1});
        truffleAssert.eventEmitted(tx2, 'NewTestedWidget', (ev) => {
          return ((ev._serial == 1234002) &&
            (ev._factory == 2) &&
            (ev._testSite == 2) &&
            (ev._results == 0xFFFF1234) &&
            (ev._widgetCount == 2) &&
            (ev._bin == 2) &&
            (ev._binCount == 1)
          );
        });
        const widget2 = await acmeWidgetCo.widgetList(1);
        assert.equal(widget2[0], 1234002, 'Widget2 incorrect serial number.');
        assert.equal(widget2[1], 2, 'Widget2 incorrect factory.');
        assert.equal(widget2[2], 2, 'Widget2 incorrect test site.');
        assert.equal(widget2[3], 0xFFFF1234, 'Widget2 incorrect recorded test result.');
    })

    // Bins are assigned automatically based on the mask. So, make sure that the
    // widgets end up in the bins where we expect them to land
    it("Test that the recorded widgets are in the expected bins", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const b1Count = await acmeWidgetCo.binWidgetCount(1);
        assert.equal(b1Count, 1, 'Bin1 should have 1 widget.');

        const b1W0 = await acmeWidgetCo.bin1Widgets(0);
        const widget1 = await acmeWidgetCo.widgetList(b1W0);
        assert.equal(widget1[0], 1234001, 'Widget1 should be the first in Bin1.');

        const b2Count = await acmeWidgetCo.binWidgetCount(1);
        assert.equal(b2Count, 1, 'Bin2 should have 1 widget.');

        const b2W0 = await acmeWidgetCo.bin2Widgets(0);
        const widget2 = await acmeWidgetCo.widgetList(b2W0);
        assert.equal(widget2[0], 1234002, 'Widget2 should be the first in Bin2.');
    })

    // Test the sales distributor functions
    it("Test that sales distributor can update bin unit price.", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const b1PriceB4 = await acmeWidgetCo.binUnitPrice(1);
        assert.equal(b1PriceB4, 100000000000000000, 'Bin1 price should be set to 100000000000000000 wei by constructor.');
        const tx = await acmeWidgetCo.updateUnitPrice(1, 200000000000000000, {from: salesdist1});
        truffleAssert.eventEmitted(tx, 'NewUnitPrice', (ev) => {
          return ((ev._bin == 1) &&
            (ev._newPrice == 200000000000000000) &&
            (ev._salesDistributor === salesdist1)
          );
        });
        const b1PriceAfter = await acmeWidgetCo.binUnitPrice(1);
        assert.equal(b1PriceAfter, 200000000000000000, 'Bin1 price should be set to 200000000000000000 wei.');

        const b2PriceB4 = await acmeWidgetCo.binUnitPrice(2);
        assert.equal(b2PriceB4, 50000000000000000, 'Bin2 price should be set to 50000000000000000 wei by constructor.');
        await acmeWidgetCo.updateUnitPrice(2, 60000000000000000, {from: salesdist1});
        const b2PriceAfter = await acmeWidgetCo.binUnitPrice(2);
        assert.equal(b2PriceAfter, 60000000000000000, 'Bin2 price should be set to 60000000000000000 wei.');

        const b3PriceB4 = await acmeWidgetCo.binUnitPrice(3);
        assert.equal(b3PriceB4, 10000000000000000, 'Bin3 price should be set to 10000000000000000 wei by constructor.');
        await acmeWidgetCo.updateUnitPrice(3, 30000000000000000, {from: salesdist1});
        const b3PriceAfter = await acmeWidgetCo.binUnitPrice(3);
        assert.equal(b3PriceAfter, 30000000000000000, 'Bin3 price should be set to 30000000000000000 wei.');
    })

    it("Test that sales distributor can update the bin mask.", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const b1MaskB4 = await acmeWidgetCo.binMask(1);
        assert.equal(b1MaskB4, 0xFFFFFFFF, "Bin1 mask should be set to 0xFFFFFFFF by constructor.");
        const tx = await acmeWidgetCo.updateBinMask(1, 0xFFFFFFFE, {from: salesdist1});
        truffleAssert.eventEmitted(tx, 'NewBinMask', (ev) => {
          return ((ev._bin == 1) &&
            (ev._newBinMask == 0xFFFFFFFE) &&
            (ev._salesDistributor === salesdist1)
          );
        });
        const b1MaskAfter = await acmeWidgetCo.binMask(1);
        assert.equal(b1MaskAfter, 0xFFFFFFFE, "Bin1 mask should be set to 0xFFFFFFFE.");

        const b2MaskB4 = await acmeWidgetCo.binMask(2);
        assert.equal(b2MaskB4, 0xFFFF0000, "Bin2 mask should be set to 0xFFFF0000 by constructor.");
        await acmeWidgetCo.updateBinMask(2, 0xFFFE0000, {from: salesdist1});
        const b2MaskAfter = await acmeWidgetCo.binMask(2);
        assert.equal(b2MaskAfter, 0xFFFE0000, "Bin2 mask should be set to 0xFFFE0000.");

        const b3MaskB4 = await acmeWidgetCo.binMask(3);
        assert.equal(b3MaskB4, 0xFF000000, "Bin3 mask should be set to 0xFF000000 by constructor.");
        await acmeWidgetCo.updateBinMask(3, 0xFE000000, {from: salesdist1});
        const b3MaskAfter = await acmeWidgetCo.binMask(3);
        assert.equal(b3MaskAfter, 0xFE000000, "Bin3 mask should be set to 0xFE000000.");
    })

    // Test the customer functions
    it("Test that customer can only buy widgets that cost <= their msg.value.", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        // Add a bunch of widgets to bin1
        await acmeWidgetCo.recordWidgetTests(1234003, 1, 1, 0xFFFFFFFF, {from: tester1});
        await acmeWidgetCo.recordWidgetTests(1234004, 1, 2, 0xFFFFFFFF, {from: tester1});
        await acmeWidgetCo.recordWidgetTests(1234005, 2, 1, 0xFFFFFFFF, {from: tester1});
        await acmeWidgetCo.recordWidgetTests(1234006, 2, 2, 0xFFFFFFFF, {from: tester1});

        // Should not be able to buy widget
        const lwBin1B4 = await acmeWidgetCo.lastWidgetSoldInBin(1);
        assert.equal(lwBin1B4, 0, "Should not have sold any Bin1 widgets yet.");
        await catchRevert(acmeWidgetCo.buyWidgets(1, 2, {from: customer1, value: 100}));
        const lwBin1After = await acmeWidgetCo.lastWidgetSoldInBin(1);
        assert.equal(lwBin1After, 0, "Should still not have sold any Bin1 widgets yet.");
    })

    it("Test customer can't buy more widgets than available even with sufficent msg.value.", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        // Should not show any widgets as having been bought
        const lwBin1B4 = await acmeWidgetCo.lastWidgetSoldInBin(1);
        assert.equal(lwBin1B4, 0, "Should not have sold any Bin1 widgets yet.");
        await catchRevert(acmeWidgetCo.buyWidgets(1, 8, {from: customer1, value: 1700000000000000000}));
        const lwBin1After = await acmeWidgetCo.lastWidgetSoldInBin(1);
        assert.equal(lwBin1After, 0, "Should still not have sold any Bin1 widgets yet.");
    })

    it("Test that customer can't buy when circuit breaker stops contract.", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const stoppedStateB4 = await acmeWidgetCo.stopContract();
        assert.equal(stoppedStateB4, false, "Contract should not be in stopped state yet.");
        await acmeWidgetCo.beginEmergency({from: admin1});
        await catchRevert(acmeWidgetCo.buyWidgets(1, 3, {from: customer1, value: 600000000000000000}));
        const lwBin1After = await acmeWidgetCo.lastWidgetSoldInBin(1);
        assert.equal(lwBin1After, 0, "Should not have sold any Bin1 widgets yet.");
        await acmeWidgetCo.endEmergency({from: admin1});
        const stoppedStateAfter = await acmeWidgetCo.stopContract();
        assert.equal(stoppedStateAfter, false, "Contract should not be in stopped state any more.");
    })

    it("Test that customer can buy multiple widgets from same bin in 1 transaction.", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const lwBin1B4 = await acmeWidgetCo.lastWidgetSoldInBin(1);
        assert.equal(lwBin1B4, 0, "Should not have sold any Bin1 widgets yet.");
        tx = await acmeWidgetCo.buyWidgets(1, 3, {from: customer1, value: 600000000000000000});
        truffleAssert.eventEmitted(tx, 'WidgetSale', (ev) => {
          return ((ev._bin == 1) &&
            (ev._quantity == 3) &&
            (ev._customer === customer1) &&
            (ev._totalAmtPaid == 600000000000000000)
          );
        });
        const lwBin1After = await acmeWidgetCo.lastWidgetSoldInBin(1);
        assert.equal(lwBin1After, 3, "Should have sold widgets 1-3 from Bin1.");
    })

    // Now that the contract has funds from the purchase by the Customer, we need a
    // way to withdraw those funds.  Check that the Admin can withdraw the funds.
    it("Test that admin can withdraw funds from contract.", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();

        const balB4 = await acmeWidgetCo.getContractBalance();
        assert.equal(balB4.toNumber(), 600000000000000000, "Balance should have been 600000000000000000 from previous sale.");
        tx = await acmeWidgetCo.withdrawFunds(600000000000000000, {from: admin1});
        truffleAssert.eventEmitted(tx, 'FundsWithdrawn', (ev) => {
          return ((ev._withdrawer == admin1) &&
            (ev._amt == 600000000000000000)
          );
        });
        const balAfter = await acmeWidgetCo.getContractBalance();
        assert.equal(balAfter.toNumber(), 0, "Should have withdrawn all funds from contract.");
    })
/*
    it("Is unit price what I expected?", async() => {
        const acmeWidgetCo = await AcmeWidgetCo.deployed();
        const bin1up = await acmeWidgetCo.binUnitPrice(1);
        console.log("Bin1 Unit Price: ", bin1up.toNumber());
    })
    */
});
