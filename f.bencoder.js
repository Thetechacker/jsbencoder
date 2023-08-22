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
    let obj;

    if(Number.isInteger(elem)){
        if(isNegativeZero(elem)){
            obj = null;
        } else {
            let objStr = elem.toString();
        
            obj = (kIsNaN(objStr) ? null : (bSymbols.integer.init + objStr + bSymbols.integer.end));
        }
    } else if(typeof elem === "string"){
        obj = (elem.length.toString() + bSymbols.string.sep + elem);
    } else if(Array.isArray(elem)){
        obj = bSymbols.list.init;

        for(let arrElem of elem){
            let objStr = bencode(arrElem);
    
            if(objStr === null){
                obj = null;

                break;
            }
    
            obj += objStr;
        }

        obj += bSymbols.list.end;
    } else if((typeof elem === "object") && (elem !== null)){
        obj = bSymbols.dict.init;

        for(let objElem of Object.entries(elem).sort()){
            let objNameStr = bencode(objElem[0]), objValueStr = bencode(objElem[1]);
    
            if(objValueStr === null){
                obj = null;

                break;
            }
    
            obj += (objNameStr + objValueStr);
        }

        obj += bSymbols.dict.end;
    } else {
        obj = null;
    }

    return obj;
}

let bdecodeStr = (str) => ((typeof str !== "string") ? null : bdecodeCharArr(str.split(""), false));

function bdecodeCharArr(arr, derefArr){
    if(!isCharArr(arr) || (typeof derefArr !== "boolean")) return null;

    let obj, kArr = (derefArr ? [...arr] : arr), fChar = kArr.shift();

    if(fChar === bSymbols.integer.init){
        let integerStr = "";

        if(kArr[0] === '-') integerStr += kArr.shift();
    
        integerStr += kArr.splice(0, kArr.findIndex(char => kIsNaN(char))).join("");
    
        obj = (((integerStr.length <= 0) || (kArr.length <= 0) || (kArr.shift() !== bSymbols.integer.end)) ? null : parseInt(integerStr));
    } else if(!kIsNaN(fChar)){
        let lengthStr = fChar + kArr.splice(0, kArr.findIndex(char => kIsNaN(char))).join("");

        obj = (((lengthStr.length <= 0) || (kArr.length <= 0) || (kArr.shift() !== bSymbols.string.sep) || (parseInt(lengthStr) > kArr.length)) ? null : kArr.splice(0, parseInt(lengthStr)).join(""));
    } else if(fChar === bSymbols.list.init){
        obj = [];

        while(kArr[0] !== bSymbols.list.end){
            let kObj = bdecodeCharArr(kArr, false);
    
            if(kObj === null){
                return null;
            }
    
            obj.push(kObj);
        }
    
        kArr.shift();
    } else if(fChar === bSymbols.dict.init){
        obj = {};

        while(kArr[0] !== bSymbols.dict.end){
            let objName = bdecodeCharArr(kArr, false), objValue = bdecodeCharArr(kArr, false);
    
            if((objName === null) || (objValue === null)) return null;
    
            obj[objName] = objValue;
        }
    
        kArr.shift();

        obj = Object.keys(obj).sort().reduce(
            (kObj, key) => { 
                kObj[key] = obj[key]; 
                return kObj;
            }, 
            {}
        );
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