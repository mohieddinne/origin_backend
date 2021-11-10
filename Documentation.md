# Documentation for the backend

Origin Apollo is an Apollo Server for Origin Expert company in Canada.

## DB Migration tool

To migrate (upgrade or downgrade) a DB to the current state of the sotware,
the server uses a module called migrations.

To create a migration, create a new file in the _./migration_ folder with this naming schema: aaaaMMddhhmm-label.js
For exemple: 202102011643-adding_rights_to_tblAccess.js

**Important**: The label part of the file name needs to with no spaces or dash (-), underscore is permitted

Every file needs to export 2 attributes .up and .down, they can be a string or async function. If the module export is a function, the migration tool will excute it as a aync-await logic. If it's a string, the migration tool will executed a SQL query using Sequelize.

**Important**: There is no going back from an execution, please backup your database if you are notre sure of what you are doing.
