const bSymbols = {
    integer: {
        init: 'i',
        end: 'e'
    },
    string: {
        sep: ':'
    },
    list: {
        init: 'l',
        end: 'e'
    },
    dict: {
        init: 'd',
        end: 'e'
    }
};

let kIsNaN = (n) => (isNaN(n) || (n.toString().includes('e') || n.toString().includes("Infinity")));
let isCharArr = (arr) => (Array.isArray(arr) && (arr.length > 0) && arr.every(obj => ((typeof obj === "string") && (obj.length === 1))));
let isNegativeZero = (n) => (kIsNaN(n) || ((1 / n) === -Infinity));

function bencode(elem){
    let objStr;

    if(typeof elem === "number"){
        objStr = bencodeInteger(elem);
    } else if(typeof elem === "string"){
        objStr = bencodeString(elem);
    } else if(Array.isArray(elem)){
        objStr = bencodeList(elem);
    } else if((typeof elem === "object") && (elem !== null)){
        objStr = bencodeDict(elem);
    } else {
        objStr = null;
    }

    return objStr;
}

function bencodeInteger(n){
    if(!Number.isInteger(n) || isNegativeZero(n)) return null;

    let objStr = n.toString();

    return (kIsNaN(objStr) ? null : (bSymbols.integer.init + objStr + bSymbols.integer.end));
}

function bencodeString(str){
    if(typeof str !== "string") return null;

    return (str.length.toString() + bSymbols.string.sep + str);
}

function bencodeList(arr){
    if(!Array.isArray(arr)) return null;

    let listStr = "";

    for(let elem of arr){
        let objStr = bencode(elem);

        if(objStr === null) return null;

        listStr += objStr;
    }

    return (bSymbols.list.init + listStr + bSymbols.list.end);
}

function bencodeDict(obj){
    if((typeof obj !== "object") || (obj === null)) return null;

    let dictStr = "";

    for(let elem of Object.entries(obj).sort()){
        let objNameStr = bencodeString(elem[0]), objValueStr = bencode(elem[1]);

        if(objValueStr === null) return null;

        dictStr += (objNameStr + objValueStr);
    }

    return (bSymbols.dict.init + dictStr + bSymbols.dict.end);
}

function bdecode(str){
    if(typeof str !== "string") return null;

    return bdecodeCharArr(str.split(""), true);
}

function bdecodeInteger(arr){
    if(!isCharArr(arr) || (arr.shift() !== bSymbols.integer.init)) return null;

    let integerStr = "";

    if(arr[0] === '-') integerStr += arr.shift();

    integerStr += arr.splice(0, arr.findIndex(char => kIsNaN(char))).join("");

    return (((integerStr.length <= 0) || (arr.length <= 0) || (arr.shift() !== bSymbols.integer.end)) ? null : parseInt(integerStr));
}

function bdecodeString(arr){
    if(!isCharArr(arr)) return null;

    let lengthStr = arr.splice(0, arr.findIndex(char => kIsNaN(char))).join("");

    return (((lengthStr.length <= 0) || (arr.length <= 0) || (arr.shift() !== bSymbols.string.sep) || (parseInt(lengthStr) > arr.length)) ? null : arr.splice(0, parseInt(lengthStr)).join(""));
}

function bdecodeList(arr){
    if(!isCharArr(arr) || (arr.shift() !== bSymbols.list.init)) return null;

    let list = [];

    while(arr[0] !== bSymbols.list.end){
        let obj = bdecodeCharArr(arr, false);

        if(obj === null){
            return null;
        }

        list.push(obj);
    }

    arr.shift();

    return list;
}

function bdecodeDict(arr){
    if(!isCharArr(arr) || (arr.shift() !== bSymbols.dict.init)) return null;

    let dict = {};

    while(arr[0] !== bSymbols.dict.end){
        let objName = bdecodeString(arr), objValue = bdecodeCharArr(arr, false);

        if((objName === null) || (objValue === null)) return null;

        dict[objName] = objValue;
    }

    arr.shift();

    dict = Object.keys(dict).sort().reduce(
        (obj, key) => { 
            obj[key] = dict[key]; 
            return obj;
        }, 
        {}
    );

    return dict;
}

function bdecodeCharArr(arr, derefArr){
    if(!isCharArr(arr) || (typeof derefArr !== "boolean")) return null;

    let obj, kArr = (derefArr ? [...arr] : arr);

    if(arr[0] === bSymbols.integer.init){
        obj = bdecodeInteger(kArr);
    } else if(!kIsNaN(arr[0])){
        obj = bdecodeString(kArr);
    } else if(arr[0] === bSymbols.list.init){
        obj = bdecodeList(kArr);
    } else if(arr[0] === bSymbols.dict.init){
        obj = bdecodeDict(kArr);
    } else {
        obj = null;
    }

    return obj;
}

// https://opensource.adobe.com/Spry/samples/data_region/JSONDataSetSample.html

console.log(bencode({
	"id": "0001",
	"type": "donut",
	"name": "Cake",
	"ppufi": 0,
    "ppufm": 55,
	"batters":
		{
			"batter":
				[
					{ "id": "1001", "type": "Regular" },
					{ "id": "1002", "type": "Chocolate" },
					{ "id": "1003", "type": "Blueberry" },
					{ "id": "1004", "type": "Devil's Food" }
				]
		},
	"topping":
		[
			{ "id": "5001", "type": "None" },
			{ "id": "5002", "type": "Glazed" },
			{ "id": "5005", "type": "Sugar" },
			{ "id": "5007", "type": "Powdered Sugar" },
			{ "id": "5006", "type": "Chocolate with Sprinkles" },
			{ "id": "5003", "type": "Chocolate" },
			{ "id": "5004", "type": "Maple" }
		]
}));