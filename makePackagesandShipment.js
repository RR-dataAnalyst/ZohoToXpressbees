const {
  makeZohoAuthenticatedRequest,
} = require("../authenticate/makeZohoAuthenticateRequest");
const datata = require("../data/data");

const makePackages = async (data, salesorder_id) => {
  try {
    const response = await makeZohoAuthenticatedRequest(
      "GET",
      `https://www.zohoapis.com/inventory/v1/salesorders/${salesorder_id}?organization_id=796826158`
    );
    // console.log(response.salesorder.line_items);
    const lineItems = await lineItemMapping(
      `${salesorder_id}`,
      response.salesorder.line_items
    );
    // console.log(lineItems); // Example: Log lineItems to see the result
    const response2 = await makeZohoAuthenticatedRequest(
      "POST",
      `https://www.zohoapis.com/inventory/v1/packages?organization_id=796826158&salesorder_id=${salesorder_id}`,
      lineItems
    );
    // console.log(response2.package.package_id);
    const response3 = await makeZohoAuthenticatedRequest(
      "POST",
      `https://www.zohoapis.com/inventory/v1/shipmentorders?organization_id=796826158&salesorder_id=${salesorder_id}&package_ids=${response2.package.package_id}`,
      {
        shipment_number: response2.package.shipment_order.shipment_number,
        date: "2024-02-29",
        delivery_method: data.CustomerName,
        tracking_number: data.AWS,
      }
    );
    console.log(response3.shipmentorder.salesorder_number, "SuccessFully");
  } catch (error) {
    console.error("Error making packages:", error);
  }
};

const lineItemMapping = async (salesorder_id, line_items) => {
  //   console.log(salesorder_id, line_items);
  const lineItemsMapped = line_items.map((element) => ({
    so_line_item_id: element.line_item_id,
    quantity: element.item_order,
  }));

  return {
    package_number: salesorder_id,
    date: "2024-02-29",
    line_items: lineItemsMapped,
  };
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Delay function

const makePackagesWithDelay = async () => {
  for (const data of datata.module) {
    await makePackages(data, data.SalesOrderID);
    await delay(2000); // Introduce a 2-second delay between each iteration
  }
};

// Call makePackagesWithDelay within an async context
(async () => {
  await makePackagesWithDelay();
})();

// Example usage:

// for (const data of datata.module) {
//   setTimeout(() => {
//     makePackages(data, data.SalesOrderID);
//     console.log(data, data.SalesOrderID);
//   }, 2000); // 2000 milliseconds = 2 seconds
// }

// makePackages(
//   {
//     SalesNumber: "SO-01448",
//     SalesOrderID: "3664422000054111119",
//     CustomerName: "Xpressbees",
//     AWS: "14344940468219",
//     Date: "2024-02-29",
//   },
//   "3664422000054111119"
// );
