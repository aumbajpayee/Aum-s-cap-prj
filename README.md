# Group_07

# CAPSTONE Project: Banking App with Finance Management Dashboard

## **Developers**
| Name                | Role                    | GitHub Handle      | Email                             |
|---------------------|-------------------------|--------------------|-----------------------------------|
| Shreya              | Database Specialist     | Mshre184sepy       | shreya1@myseneca.ca               |
| Aum Shekhar Bajpayee| Back-End Developer      | aumbajpayee        | baum-shekhar@myseneca.ca          |
| Anurag Das          | Front-End Developer     | anurag56964        | adas35@myseneca.ca                |
| Japit Jot Singh     | Integration Specialist  | jsingh-1010        | jsingh1010@myseneca.ca            |

## **Project Description**
This project is focused on building and deploying a modern **banking app** that features a **finance management dashboard**. The app enables users to manage their financial lives by connecting multiple bank accounts, monitoring real-time transactions, transferring funds, and more.

---

## **Features**

**Authentication:**
Provides ultra-secure SSR (Server-Side Rendering) authentication with robust validation and authorization mechanisms.

**Connect Banks:**
Integrates with **Plaid** to allow users to securely link multiple bank accounts for transaction tracking and analysis.

**Home Page:**
Displays a general overview of the user's account, including:
- Total balance across all connected banks.
- Recent transactions.
- Insights on spending by categories (e.g., groceries, utilities).

**My Banks:**
A dedicated page that lists all connected banks with:
- Account balances.
- Detailed account information.

**Transaction History:**
Comprehensive transaction history with features like:
- Pagination for easy navigation.
- Filtering options to view specific transaction details by date, amount, or category.

**Real-time Updates:**
Automatically reflects changes across relevant pages whenever new bank accounts are linked.

**Funds Transfer:**
Enables users to transfer money to other accounts using **Dwolla**, with necessary fields like recipient name and bank ID for secure transactions.

**Responsiveness:**
Ensures seamless adaptation across various screen sizes and devices, providing a consistent and user-friendly experience on desktops, tablets, and mobile devices.

**Code Architecture and Reusability:**
Follows best practices for clean, modular, and reusable code to streamline development and improve maintainability.

---

## **Tech Stack**

### **Frontend**
- **Next.js**: Framework for server-side rendering and optimized web applications.
- **TypeScript**: Ensures type safety and reduces runtime errors.
- **TailwindCSS**: A utility-first CSS framework for building modern, responsive designs.
- **ShadCN**: Provides pre-styled, customizable components for faster development.
- **Chart.js**: Used to create interactive visualizations for financial data.

### **Backend**
- **Appwrite**: Open-source backend as a service (BaaS) for authentication, database, and storage management.

### **Integrations**
- **Plaid**: Allows secure linking of multiple bank accounts and fetching transaction data.
- **Dwolla**: Facilitates money transfers between platform users.

### **Form Validation**
- **React Hook Form**: Simplifies form management and validation.
- **Zod**: Provides schema-based validation for consistent data handling.

### **Developing Tools**
- **Visual Studio Code**: IDE for efficient development.
- **Postman**: For testing and debugging APIs.
- **Git**: Version control for collaborative development.

**Figma Link** - https://www.figma.com/design/5xggxrYe325ek0cuq8iRfT/Untitled?node-id=0-1&t=2nfWKuPUaj5effVa-1
**Logical Flow Figma File** - https://www.figma.com/design/jq8rRcQj2nfmgl2xpXyYcu/Untitled?node-id=0-1&t=yeanG7KwmS5LN1AM-1

