const { makeZohoAuthenticatedRequest } = require("./ZohoAccessToken");
const axios = require("axios");

class ZohoAllSalesOrder {
  constructor() {}

  async extractAllSalesOrder() {
    try {
      // We can use filter here
      const response = await makeZohoAuthenticatedRequest(
        "GET",
        "https://www.zohoapis.com/inventory/v1/salesorders?organization_id=796826158&date=2024-03-13"

        
      );
      const filteredSalesOrders = response.salesorders.filter(
        (salesorder) => salesorder.source === "Api"
      );

      console.log(filteredSalesOrders);
      return { salesorders: filteredSalesOrders }; 
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
      // console.log(response); ${salesOrder_id}
      return response;
    } catch (err) {
      console.error("Error while retrieving the Sales Order", err);
    }
  }
}

class CreatePackage {
  constructor(zohoSalesOrderDetails) {
    this.zohoSalesOrderDetails = zohoSalesOrderDetails;


  }

  async createPackage() {
    const salesOrder_id = this.zohoSalesOrderDetails.salesorder.salesorder_id;
    const salesOrder = this.zohoSalesOrderDetails.salesorder;
    // console.log(salesOrder);
    // console.log(salesOrder_id);
    // let processedline_items = this.zohoSalesOrderDetails.salesorder.map(
    //   (salesOrder) => {
    //     return {
    //       so_line_item_id: salesOrder.line_items.line_item_id,
    //       quantity: 3,
    //     };
    //   }
    // );
    // const body = {
    //   package_number: "TEST0001",
    //   date: "2024-01-30",
    //   line_items: processedline_items,
    //   notes: "notes",
    // };
    // console.log(body);
    // try {
    //   makeZohoAuthenticatedRequest(
    //     "POST",
    //     `https://www.zohoapis.com/inventory/v1/packages?organization_id=796826158&salesorder_id=${salesOrder_id}`,
    //     body
    //   );
    // } catch (err) {
    //   console.error("Error While creating the Package");
    // }
  }
}

class SalesOrderProcessor {
  constructor() {
    this.zohoAllSalesOrder = new ZohoAllSalesOrder();
    this.zohoSalesOrder = new ZohoSalesOrder();
  }

  async processSalesOrders() {
    try {
      const allSalesOrderDetails =
        await this.zohoAllSalesOrder.extractAllSalesOrder();
      // console.log(allSalesOrderDetails);
      for (const salesOrderDetail of allSalesOrderDetails.salesorders) {
        let details = await this.zohoSalesOrder.getASalesOrder(
          salesOrderDetail.salesorder_id
        );

        let createorderFlipkart = async () => {
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
                details.salesorder.shipping_address?.phone.trim() ||
                "9999706071",
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
            // order_items: [
            //   {
            //     name: "Flipkart Transparent Security Bag SB3 12.5 inch x 15 inch 52",
            //     qty: "1",
            //     sku: "39232100",
            //     price: "100",
            //   },
            // ],
            order_items,
            courier_id: 1,
            collectable_amount: "0",
          };
          console.log(body);

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
        createorderFlipkart();

        // Write here LOGIC for the LOGISTICS Selection;

        // Call Create Package here
        // const createPackage = new CreatePackage(details); // Pass the salesOrderDetail here
        // const singlePackage = await createPackage.createPackage();
        // console.log(singlePackage);
      }
      return "DONE With Process Invoice";
    } catch (error) {
      console.error(
        "Error occurred while fetching and processing sales orders:",
        error
      );
    }
  }
}

async function runSalesOrderProcessing() {
  try {
    // Create an instance of SalesOrderProcessor
    const salesOrderProcessor = new SalesOrderProcessor();

    const result = await salesOrderProcessor.processSalesOrders();
    console.log(result);
  } catch (error) {
    // Handle errors
    console.error("An error occurred during the process:", error);
  }
}
runSalesOrderProcessing();



module.exports = {
  ZohoAllSalesOrder,
  ZohoSalesOrder,
  CreatePackage,
  SalesOrderProcessor,
  runSalesOrderProcessing
};

// class XpressBees {
  //   constructor() {}
  //   async createAOrder() {
  //     const body = {
  //       order_number: "TEST0123",
  //       unique_order_number: "yes",
  //       shipping_charges: 0,
  //       discount: 0,
  //       cod_charges: 0,
  //       payment_type: "prepaid",
  //       order_amount: 8640,
  //       package_weight: 200,
  //       package_length: 20,
  //       package_breadth: 20,
  //       package_height: 20,
  //       request_auto_pickup: "yes",
  //       consignee: {
  //         name: "VIJAYBHAI ",
  //         address:
  //           "GROUND FLOOR,PLOT NO.29,, VRUNDAVAN ESTATE,, ANJANA,, SURAT, Surat, Gujarat, 395001",
  //         address_2: "",
  //         city: "Surat",
  //         state: "Gujarat",
  //         pincode: "395006",
  //         phone: "8866674181",
  //       },
  //       pickup: {
  //         warehouse_name: "R&R Consulting",
  //         name: "PROCURRE",
  //         address: "Plot no 530, sector 8, IMT Manesar",
  //         address_2: "IMT Manesar , Manesar",
  //         city: "GURGAON",
  //         state: "HARYANA",
  //         pincode: "122052",
  //         phone: "9999706071",
  //       },
  //       order_items: [
  //         {
  //           name: "Flipkart Transparent Security Bag SB3 12.5 inch x 15 inch 52",
  //           qty: "1",
  //           sku: "39232100",
  //           price: "100",
  //         },
  //       ],
  //       courier_id: "1",
  //       collectable_amount: "0",
  //     };
  //   }
  // }
