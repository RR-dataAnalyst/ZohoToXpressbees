//zohotoxpressbees.js
const { makeZohoAuthenticatedRequest } = require("./ZohoAccessToken");
const axios = require("axios");

class ZohoAllSalesOrder {
  constructor() {}

  async extractAllSalesOrder() {
    try {
      const response = await makeZohoAuthenticatedRequest(
        "GET",
        "https://www.zohoapis.com/inventory/v1/salesorders?organization_id=796826158&date=2024-03-13"
      );

      console.log(response.data);
      return response;
    } catch (err) {
      console.error(err);
    }
  }
}

class ZohoSalesOrder {
  constructor(zohoSalesOrderDetails) {
    this.zohoSalesOrderDetails = zohoSalesOrderDetails;
  }

  async getASalesOrder(salesOrder_id) {
    try {
      const response = await makeZohoAuthenticatedRequest(
        "GET",
        `https://www.zohoapis.com/books/v3/salesorders/${salesOrder_id}?organization_id=796826158`
      );

      return response;
    } catch (err) {
      console.error("Error while retrieving the Sales Order", err);
    }
  }
}

class SalesOrderProcessor {
  constructor() {
    this.zohoAllSalesOrder = new ZohoAllSalesOrder();
    this.zohoSalesOrder = new ZohoSalesOrder();
  }

  async processSalesOrders() {
    try {
      const allSalesOrderDetails = await this.zohoAllSalesOrder.extractAllSalesOrder();

      for (const salesOrderDetail of allSalesOrderDetails.salesorders) {
        let details = await this.zohoSalesOrder.getASalesOrder(salesOrderDetail.salesorder_id);

        let createOrderXpressBees = async () => {
          const XpressBeesaccessToken =
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3MTAzMDY0NjQsImp0aSI6IkhSYzRQdWJta1NKTitYU1dDVXBwSkszVkxxZzMxNVY4bkI4WmtYaTh1SWs9IiwibmJmIjoxNzEwMzA2NDY0LCJleHAiOjE3MTAzMTcyNjQsImRhdGEiOnsidXNlcl9pZCI6Ijg0NjEyIiwicGFyZW50X2lkIjoiMCIsImVtYWlsIjoib3JkZXJzQHRoZXJyZ3JvdXAuaW4ifX0._BIwsCX0j1gP74c8EjohluFRtNmN-_PvXsflbSBmEIiXFHiygtegCbIkhpwH5wckjdxoZK1VTrgRixnIQ0ogNw";

          const order_items = details.salesorder.line_items.map((itemList) => {
            return {
              name: itemList.name,
              qty: itemList.quantity,
              sku: itemList.sku,
              price: itemList.rate,
            };
          });

          const body = {
            order_number: details.salesorder.reference_number,
            unique_order_number: "yes",
            shipping_charges: 0,
            discount: 0,
            cod_charges: 0,
            payment_type: "prepaid",
            order_amount: details.salesorder.total,
            package_weight: 200,
            package_length: 20,
            package_breadth: 20,
            package_height: 20,
            request_auto_pickup: "yes",
            consignee: {
              name: details.salesorder.customer_name,
              address:
                details.salesorder.shipping_address.address ||
                details.salesorder.billing_address.address,
              address_2: "",
              city: details.salesorder.shipping_address.city,
              state: details.salesorder.shipping_address.state.trim(),
              pincode: details.salesorder.shipping_address.zip,
              phone:
                details.salesorder.shipping_address?.phone.trim() || "9999706071",
            },
            pickup: {
              warehouse_name: "R&R Consulting",
              name: "PROCURRE",
              address: "Plot no 530, sector 8, IMT Manesar",
              address_2: "IMT Manesar , Manesar",
              city: "GURGAON",
              state: "HARYANA",
              pincode: "122052",
              phone: "9999706071",
            },
            order_items,
            courier_id: 1,
            collectable_amount: "0",
          };

          try {
            const response = await axios.post(
              "https://shipment.xpressbees.com/api/shipments2",
              body,
              {
                headers: {
                  Authorization: `Bearer ${XpressBeesaccessToken}`,
                },
              }
            );

            console.log(response.data);
          } catch (error) {
            console.error(
              "Error occurred:",
              error.response.data,
              "->",
              details.salesorder.salesorder_id
            );
          }
        };

        createOrderXpressBees();
      }
      return "DONE With Process Invoice";
    } catch (error) {
      console.error("Error occurred while fetching and processing sales orders:", error);
    }
  }
}

const createPackageAndShipmentOnZoho = async (data, salesorder_id) => {
  let details = await this.zohoSalesOrder.getASalesOrder(salesOrderDetail.salesorder_id);
  try {
    const response = await makeZohoAuthenticatedRequest(
      "GET",
      `https://www.zohoapis.com/inventory/v1/salesorders/${salesorder_id}?organization_id=796826158`
    );

    const lineItems = await lineItemMapping(
      `${salesorder_id}`,
      response.salesorder.line_items
    );

    const response2 = await makeZohoAuthenticatedRequest(
      "POST",
      `https://www.zohoapis.com/inventory/v1/packages?organization_id=796826158&salesorder_id=${salesorder_id}`,
      lineItems
    );
    
    const xpressbeesShipmentData = await createorderFlipkart(salesorder_id);
    const trackingNumber = xpressbeesShipmentData.awb_number;
    const response3 = await makeZohoAuthenticatedRequest(
      "POST",
      `https://www.zohoapis.com/inventory/v1/shipmentorders?organization_id=796826158&salesorder_id=${salesorder_id}&package_ids=${response2.package.package_id}`,
      {
        shipment_number: response2.package.shipment_order.shipment_number,
        date: details.date,
        delivery_method: details.customer_name,
        tracking_number: trackingNumber,
      }
    );

    console.log(response3.shipmentorder.salesorder_number, "Successfully");
  } catch (error) {
    console.error("Error making packages on Zoho:", error);
  }
};

const lineItemMapping = async (salesorder_id, line_items) => {
  const lineItemsMapped = line_items.map((element) => ({
    so_line_item_id: element.line_item_id,
    quantity: element.item_order,
  }));

  return {
    package_number: salesorder_id,
    date: details.date,
    line_items: lineItemsMapped,
  };
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Delay function

const mergeFiles = async () => {
  try {
    const salesOrderProcessor = new SalesOrderProcessor();
    const result = await salesOrderProcessor.processSalesOrders();

    for (const data of datata.module) {
      await createPackageAndShipmentOnZoho(data, data.SalesOrderID);
      await delay(2000); 
    }

    console.log(result);
  } catch (error) {
    console.error("An error occurred during the process:", error);
  }
};
(async () => {
  await mergeFiles();
})();
