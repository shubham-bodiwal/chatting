const { Client } = require(`pg`);

const client = new Client({
  host: `localhost`,
  user: `postgres`,
  port: 5432,
  password: `1`,
  database: `chatingApp`,
});

client.connect((err) => {
  if (err) {
    console.error(`connection error`, err.stack);
  } else {
    console.log(`connected`);
  }
});

const joinArr = (arr) => {
  return arr
    .map((e) => {
      return `('${e}')`;
    })
    .join();
};

const SignupQuery = async (args) => {
  try {
    const UserAlreadyExist = await client.query(
      `select userid from  userinfo where email = '${args.email}'`
    );
    if (UserAlreadyExist.rowCount) {
      return "user already exist, Please login";
    } else {
      const result =
        await client.query(`INSERT INTO userinfo(  name, password, email)
  VALUES ('${args.name}', '${args.password}', '${args.email}') returning *`);
      return result.rowCount ? result.rows[0] : "some internal error";
    }
  } catch (err) {
    console.log(`SignupQuery`, err);
  }
};

const getUserDetailsQuery = async (args) => {
  try {
    const result = await client.query(
      `select description, email, lastseen, name, pofileimage, 
        userid from userinfo where userid = ${args.userid}`
    );
    return result.rows[0] ? result.rows[0] : {};
  } catch (err) {
    console.log(`getUserDetailsQuery`, err);
  }
};

const loginQuery = async (args) => {
  try {
    const result = await client.query(
      `select userid, password from  userinfo where email = '${args.email}'`
    );
    console.log(result.rows);
    if (result.rowCount) {
      if (result.rows[0].password === args.password) {
        return result.rows[0] ? { userid: result.rows[0].userid } : {};
      } else {
        return "invalid password";
      }
    } else {
      return "user not registered, please register";
    }
  } catch (err) {
    console.log(`loginQuery`, err);
  }
};

const updateAboutQuery = async (args) => {
  try {
    const result = await client.query(
      `update  userinfo  set description = '${args.desc}' where email = '${args.email}' returning *`
    );

    return result.rows[0];
  } catch (err) {
    console.log(`updateAboutQuery`, err);
  }
};

const updateLastSeenQuery = async (args) => {
  try {
    const result = await client.query(
      `update  userinfo  set lastseen = '${args.lastseen}' where email = '${args.email}' returning *`
    );
    return result.rows[0];
  } catch (err) {
    console.log(`updateLastSeenQuery`, err);
  }
};

const GetAllUserListquery = async () => {
  try {
    const result =
      await client.query(`select description, lastseen, name, pofileimage, 
        userid from userinfo`);

    console.log("data", result.rows);
    return result.rows;
  } catch (err) {
    console.log(`GetAllUserListquery`, err);
  }
};

const GetUserRoomIDsQuery = async (args) => {
  try {
    const result = await client.query(
      `select *,(select json_agg(data) from (select * from  messages m where m.roomid = r.roomid) data) 
        as messages from rooms r where  ${args.userid} = any(userlist)`
    );
    return result.rows;
  } catch (err) {
    console.log(`GetUserRoomIDsQuery`, err);
  }
};

const CreateNewRoomQuery = async (args) => {
  try {
    const roomAlreadyExist = await client.query(
      `select * from rooms where ${args.userList[0]} = any(userlist) and ${args.userList[1]} = any(userlist) `
    );

    if (roomAlreadyExist.rows.length === 0) {
      const result = await client.query(
        `INSERT INTO rooms (userlist,name) VALUES ('{${args.userList}}','${args.roomName}') returning *`
      );
      return result.rows[0];
    } else {
      return roomAlreadyExist.rows[0];
    }
  } catch (err) {
    console.log(`CreateNewRoom`, err);
  }
};

const AddNewMessage = async (args) => {
  try {
    const result =
      await client.query(`INSERT INTO messages(roomid, userid, message, time, type)
	VALUES (${args.roomid}, ${args.userid}, '${args.msg}', '${args.time}', '${args.type}') returning *`);
    return result.rows[0];
  } catch (err) {
    console.log(`addNewMessage`, err);
  }
};

module.exports = {
  AddNewMessage,
  SignupQuery,
  loginQuery,
  updateAboutQuery,
  updateLastSeenQuery,
  GetAllUserListquery,
  GetUserRoomIDsQuery,
  CreateNewRoomQuery,
  getUserDetailsQuery,
};
