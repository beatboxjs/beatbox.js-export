// libmp3lame.js - port of libmp3lame to JavaScript using emscripten
// by Andreas Krennmair <ak@synflood.at>
var Lame = (function() {
// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = {}; //require('fs');
  var nodePath = {}; //require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((low>>>0)+((high>>>0)*4294967296)) : ((low>>>0)+((high|0)*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math.min(Math.floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 147208;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _tabsel_123;
var _stderr;
var _stderr = _stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _freqs;
var ___progname;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTVN10__cxxabiv117__class_type_infoE;
var __ZNSt9bad_allocC1Ev;
var __ZNSt9bad_allocD1Ev;
var __ZNSt20bad_array_new_lengthC1Ev;
var __ZNSt20bad_array_new_lengthD1Ev;
var __ZNSt20bad_array_new_lengthD2Ev;
var _err;
var _errx;
var _warn;
var _warnx;
var _verr;
var _verrx;
var _vwarn;
var _vwarnx;
/* memory initializer */ allocate([0,27,134,42,204,204,52,43,33,78,132,43,252,247,157,43,88,156,166,43,252,247,157,43,33,78,132,43,204,204,52,43,0,27,134,42,83,248,191,44,254,169,171,44,146,50,149,44,159,129,122,44,239,29,73,44,62,186,23,44,116,173,207,43,133,159,107,43,183,89,146,42,83,248,191,172,254,169,171,172,146,50,149,172,159,129,122,172,239,29,73,172,62,186,23,172,116,173,207,171,133,159,107,171,183,89,146,170,0,27,134,170,204,204,52,171,33,78,132,171,252,247,157,171,88,156,166,171,252,247,157,171,33,78,132,171,204,204,52,171,0,27,134,170,0,27,134,42,204,204,52,43,33,78,132,43,252,247,157,43,88,156,166,43,252,247,157,43,33,78,132,43,204,204,52,43,0,27,134,42,83,248,191,44,254,169,171,44,146,50,149,44,159,129,122,44,239,29,73,44,62,186,23,44,116,173,207,43,133,159,107,43,183,89,146,42,37,39,192,172,51,37,173,172,234,209,152,172,227,84,131,172,249,175,89,172,11,14,43,172,102,34,244,171,201,49,137,171,74,123,157,170,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,144,128,170,174,79,227,170,5,174,113,170,234,207,6,62,205,19,212,62,139,111,68,63,255,175,139,63,23,208,166,63,117,235,200,63,190,226,245,63,122,130,26,64,105,251,74,64,185,87,144,64,107,16,243,64,233,58,183,65,92,28,124,63,187,141,36,63,68,29,175,62,178,143,112,63,212,208,49,190,125,27,68,191,215,179,93,63,0,0,0,63,254,181,3,191,218,134,241,190,2,115,160,190,116,71,58,190,29,176,193,189,135,203,39,189,29,161,104,188,70,123,114,187,168,132,91,63,216,185,97,63,221,26,115,63,129,186,123,63,65,218,126,63,253,200,127,63,101,249,127,63,141,255,127,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,144,128,42,174,79,227,42,5,174,113,42,37,39,192,44,51,37,173,44,234,209,152,44,227,84,131,44,249,175,89,44,11,14,43,44,102,34,244,43,201,49,137,43,74,123,157,42,83,248,191,172,254,169,171,172,146,50,149,172,159,129,122,172,239,29,73,172,62,186,23,172,116,173,207,171,133,159,107,171,183,89,146,170,0,27,134,170,204,204,52,171,33,78,132,171,252,247,157,171,88,156,166,171,252,247,157,171,33,78,132,171,204,204,52,171,0,27,134,170,137,158,227,63,229,83,236,63,167,94,245,63,155,20,249,63,14,217,252,63,123,143,234,63,218,151,217,63,226,132,191,63,124,145,168,63,0,0,128,63,0,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,102,102,166,64,0,0,250,66,102,102,134,192,154,153,201,192,154,153,153,64,0,0,128,63,0,0,0,0,0,0,0,0,2,0,0,0,21,0,0,0,236,81,120,63,0,0,160,64,0,0,200,66,1,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,154,153,169,64,0,0,250,66,102,102,102,192,51,51,179,192,0,0,144,64,0,0,192,63,0,0,0,0,0,0,0,0,2,0,0,0,21,0,0,0,205,204,172,63,0,0,160,64,0,0,200,66,2,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,51,51,179,64,0,0,250,66,205,204,12,192,0,0,96,192,51,51,51,64,0,0,0,64,0,0,0,0,0,0,0,0,2,0,0,0,21,0,0,0,82,184,190,63,0,0,160,64,0,0,200,66,3,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,154,153,185,64,0,0,2,67,102,102,230,191,51,51,51,192,102,102,38,64,0,0,64,64,0,0,128,192,0,0,0,0,2,0,0,0,20,0,0,0,133,235,209,63,0,0,160,64,0,0,200,66,4,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,0,0,192,64,0,0,7,67,51,51,51,191,205,204,140,191,205,204,140,63,0,0,96,64,0,0,0,193,0,0,0,0,2,0,0,0,0,0,0,0,184,30,229,63,0,0,160,64,0,0,200,66,5,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,205,204,204,64,0,0,12,67,0,0,0,63,205,204,204,62,0,0,240,192,0,0,128,64,0,0,64,193,23,183,81,57,0,0,0,0,0,0,0,0,154,153,249,63,0,0,160,64,0,0,200,66,6,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,51,51,211,64,0,0,17,67,31,133,43,63,102,102,38,63,51,51,107,193,0,0,208,64,0,0,152,193,23,183,209,57,0,0,0,0,0,0,0,0,51,51,19,64,0,0,160,64,0,0,200,66,7,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,51,51,211,64,0,0,17,67,205,204,76,63,0,0,64,63,154,153,157,193,0,0,0,65,0,0,176,193,82,73,29,58,0,0,0,0,0,0,0,0,205,204,44,64,0,0,160,64,0,0,200,66,8,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,51,51,211,64,0,0,17,67,154,153,153,63,51,51,147,63,0,0,220,193,0,0,32,65,0,0,184,193,52,128,55,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,64,0,0,200,66,9,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,51,51,211,64,0,0,17,67,205,204,204,63,205,204,204,63,0,0,16,194,0,0,48,65,0,0,200,193,23,183,81,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,64,0,0,200,66,10,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,51,51,211,64,0,0,17,67,0,0,0,64,0,0,0,64,0,0,16,194,0,0,64,65,0,0,200,193,23,183,81,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,64,0,0,200,66,0,0,0,0,0,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,102,102,134,64,0,0,200,65,154,153,217,192,154,153,217,192,51,51,227,64,0,0,128,63,0,0,0,0,0,0,0,0,2,0,0,0,31,0,0,0,0,0,128,63,0,0,160,64,0,0,200,66,1,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,102,102,134,64,0,0,200,65,154,153,153,192,154,153,153,192,205,204,172,64,51,51,179,63,0,0,128,191,0,0,0,0,2,0,0,0,27,0,0,0,178,157,143,63,0,0,160,64,0,0,196,66,2,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,102,102,134,64,0,0,200,65,102,102,38,192,102,102,38,192,205,204,108,64,0,0,0,64,0,0,64,192,0,0,0,0,2,0,0,0,23,0,0,0,47,221,164,63,0,0,160,64,0,0,194,66,3,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,102,102,134,64,0,0,200,65,205,204,204,191,205,204,204,191,0,0,0,64,0,0,0,64,0,0,160,192,0,0,0,0,2,0,0,0,18,0,0,0,223,79,189,63,0,0,160,64,0,0,192,66,4,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,102,102,134,64,0,0,200,65,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,193,0,0,0,0,2,0,0,0,12,0,0,0,16,88,217,63,0,0,160,64,0,0,190,66,5,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,102,102,134,64,0,0,200,65,102,102,166,63,102,102,166,63,0,0,192,192,0,0,96,64,0,0,48,193,0,0,0,0,2,0,0,0,8,0,0,0,154,153,249,63,0,0,160,64,102,102,188,66,6,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,0,0,144,64,0,0,200,66,205,204,12,64,51,51,19,64,0,0,64,193,0,0,192,64,0,0,96,193,0,0,0,0,2,0,0,0,4,0,0,0,199,75,15,64,0,0,64,64,205,204,187,66,7,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,154,153,153,64,0,0,72,67,205,204,44,64,205,204,44,64,0,0,144,193,0,0,16,65,0,0,136,193,0,0,0,0,2,0,0,0,0,0,0,0,225,122,36,64,0,0,128,63,51,51,187,66,8,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,154,153,169,64,0,0,150,67,51,51,51,64,51,51,51,64,0,0,168,193,0,0,32,65,0,0,184,193,23,183,81,57,0,0,0,0,0,0,0,0,47,221,60,64,0,0,0,0,154,153,186,66,9,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,51,51,211,64,0,0,150,67,51,51,51,64,51,51,51,64,0,0,184,193,0,0,48,65,0,0,200,193,82,73,29,58,0,0,0,0,0,0,0,0,254,212,88,64,0,0,0,0,154,153,186,66,10,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,0,0,200,65,0,0,150,67,51,51,51,64,51,51,51,64,0,0,200,193,0,0,64,65,0,0,216,193,10,215,35,59,0,0,0,0,0,0,0,0,0,0,96,64,0,0,0,0,154,153,186,66,0,0,0,0,3,0,1,0,4,0,4,0,6,0,7,0,8,0,8,0,4,0,4,0,4,0,5,0,6,0,8,0,7,0,9,0,5,0,7,0,6,0,8,0,7,0,9,0,8,0,10,0,7,0,8,0,7,0,8,0,8,0,9,0,9,0,10,0,2,0,1,0,3,0,4,0,7,0,7,0,4,0,4,0,4,0,5,0,7,0,7,0,6,0,6,0,7,0,7,0,8,0,8,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,128,63,54,89,75,63,152,134,33,63,152,134,33,63,152,134,33,63,152,134,33,63,152,134,33,63,250,155,128,62,153,158,240,61,0,0,0,0,3,4,6,7,9,10,4,5,6,7,8,10,5,6,7,8,9,10,7,7,8,9,9,10,8,8,9,9,10,11,9,9,10,10,11,11,0,0,0,0,7,0,5,0,9,0,14,0,15,0,7,0,6,0,4,0,5,0,5,0,6,0,7,0,7,0,6,0,8,0,8,0,8,0,5,0,15,0,6,0,9,0,10,0,5,0,1,0,11,0,7,0,9,0,6,0,4,0,1,0,14,0,4,0,6,0,2,0,6,0,0,0,2,4,7,9,9,10,4,4,6,10,10,10,7,6,8,10,10,11,9,10,10,11,11,12,9,9,10,11,12,12,10,10,11,11,13,13,0,0,0,0,3,0,4,0,6,0,18,0,12,0,5,0,5,0,1,0,2,0,16,0,9,0,3,0,7,0,3,0,5,0,14,0,7,0,3,0,19,0,17,0,15,0,13,0,10,0,4,0,13,0,5,0,8,0,11,0,5,0,1,0,12,0,4,0,4,0,1,0,1,0,0,0,1,4,7,9,9,10,4,6,8,9,9,10,7,7,9,10,10,11,8,9,10,11,11,11,8,9,10,11,11,12,9,10,11,12,12,12,0,0,0,0,1,0,2,0,10,0,19,0,16,0,10,0,3,0,3,0,7,0,10,0,5,0,3,0,11,0,4,0,13,0,17,0,8,0,4,0,12,0,11,0,18,0,15,0,11,0,2,0,7,0,6,0,9,0,14,0,3,0,1,0,6,0,4,0,5,0,3,0,2,0,0,0,3,4,6,8,4,4,6,7,5,6,7,8,7,7,8,9,7,0,3,0,5,0,1,0,6,0,2,0,3,0,2,0,5,0,4,0,4,0,1,0,3,0,3,0,2,0,0,0,1,4,7,8,4,5,8,9,7,8,9,10,8,8,9,10,1,0,2,0,6,0,5,0,3,0,1,0,4,0,4,0,7,0,5,0,7,0,1,0,6,0,1,0,1,0,0,0,2,3,7,4,4,7,6,7,8,0,0,0,0,0,0,0,3,0,2,0,1,0,1,0,1,0,1,0,3,0,2,0,0,0,0,0,0,0,0,0,4,5,5,6,5,6,6,7,5,6,6,7,6,7,7,8,15,0,28,0,26,0,48,0,22,0,40,0,36,0,64,0,14,0,24,0,20,0,32,0,12,0,16,0,8,0,0,0,1,5,5,7,5,8,7,9,5,7,7,9,7,9,9,10,1,0,10,0,8,0,20,0,12,0,20,0,16,0,32,0,14,0,12,0,24,0,0,0,28,0,16,0,24,0,16,0,1,4,7,4,5,7,6,7,8,0,0,0,0,0,0,0,1,0,2,0,1,0,3,0,1,0,1,0,3,0,2,0,0,0,0,0,0,0,0,0,4,5,7,8,9,10,10,11,11,12,12,12,12,12,13,10,5,6,7,8,9,10,10,11,11,11,12,12,12,12,12,10,7,7,8,9,9,10,10,11,11,11,11,12,12,12,13,9,8,8,9,9,10,10,10,11,11,11,11,12,12,12,12,9,9,9,9,10,10,10,10,11,11,11,12,12,12,12,13,9,10,9,10,10,10,10,11,11,11,11,12,12,12,12,12,9,10,10,10,10,10,11,11,11,11,12,12,12,12,12,13,9,11,10,10,10,11,11,11,11,12,12,12,12,12,13,13,10,11,11,11,11,11,11,11,11,11,12,12,12,12,13,13,10,11,11,11,11,11,11,11,12,12,12,12,12,13,13,13,10,12,11,11,11,11,12,12,12,12,12,12,13,13,13,13,10,12,12,11,11,11,12,12,12,12,12,12,13,13,13,13,10,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,10,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,10,13,12,12,12,12,12,12,13,13,13,13,13,13,13,13,10,9,9,9,9,9,9,9,9,9,9,9,10,10,10,10,6,15,0,13,0,46,0,80,0,146,0,6,1,248,0,178,1,170,1,157,2,141,2,137,2,109,2,5,2,8,4,88,0,14,0,12,0,21,0,38,0,71,0,130,0,122,0,216,0,209,0,198,0,71,1,89,1,63,1,41,1,23,1,42,0,47,0,22,0,41,0,74,0,68,0,128,0,120,0,221,0,207,0,194,0,182,0,84,1,59,1,39,1,29,2,18,0,81,0,39,0,75,0,70,0,134,0,125,0,116,0,220,0,204,0,190,0,178,0,69,1,55,1,37,1,15,1,16,0,147,0,72,0,69,0,135,0,127,0,118,0,112,0,210,0,200,0,188,0,96,1,67,1,50,1,29,1,28,2,14,0,7,1,66,0,129,0,126,0,119,0,114,0,214,0,202,0,192,0,180,0,85,1,61,1,45,1,25,1,6,1,12,0,249,0,123,0,121,0,117,0,113,0,215,0,206,0,195,0,185,0,91,1,74,1,52,1,35,1,16,1,8,2,10,0,179,1,115,0,111,0,109,0,211,0,203,0,196,0,187,0,97,1,76,1,57,1,42,1,27,1,19,2,125,1,17,0,171,1,212,0,208,0,205,0,201,0,193,0,186,0,177,0,169,0,64,1,47,1,30,1,12,1,2,2,121,1,16,0,79,1,199,0,197,0,191,0,189,0,181,0,174,0,77,1,65,1,49,1,33,1,19,1,9,2,123,1,115,1,11,0,156,2,184,0,183,0,179,0,175,0,88,1,75,1,58,1,48,1,34,1,21,1,18,2,127,1,117,1,110,1,10,0,140,2,90,1,171,0,168,0,164,0,62,1,53,1,43,1,31,1,20,1,7,1,1,2,119,1,112,1,106,1,6,0,136,2,66,1,60,1,56,1,51,1,46,1,36,1,28,1,13,1,5,1,0,2,120,1,114,1,108,1,103,1,4,0,108,2,44,1,40,1,38,1,32,1,26,1,17,1,10,1,3,2,124,1,118,1,113,1,109,1,105,1,101,1,2,0,9,4,24,1,22,1,18,1,11,1,8,1,3,1,126,1,122,1,116,1,111,1,107,1,104,1,102,1,100,1,0,0,43,0,20,0,19,0,17,0,15,0,13,0,11,0,9,0,7,0,6,0,4,0,7,0,5,0,3,0,1,0,3,0,1,4,3,5,0,0,0,0,1,0,1,0,1,0,0,0,1,5,7,9,10,10,11,11,12,12,12,13,13,13,14,10,4,6,8,9,10,11,11,11,12,12,12,13,14,13,14,10,7,8,9,10,11,11,12,12,13,12,13,13,13,14,14,11,9,9,10,11,11,12,12,12,13,13,14,14,14,15,15,12,10,10,11,11,12,12,13,13,13,14,14,14,15,15,15,11,10,10,11,11,12,13,13,14,13,14,14,15,15,15,16,12,11,11,11,12,13,13,13,13,14,14,14,14,15,15,16,12,11,11,12,12,13,13,13,14,14,15,15,15,15,17,17,12,11,12,12,13,13,13,14,14,15,15,15,15,16,16,16,12,12,12,12,13,13,14,14,15,15,15,15,16,15,16,15,13,12,13,12,13,14,14,14,14,15,16,16,16,17,17,16,12,13,13,13,13,14,14,15,16,16,16,16,16,16,15,16,13,13,14,14,14,14,15,15,15,15,17,16,16,16,16,18,13,15,14,14,14,15,15,16,16,16,18,17,17,17,19,17,13,14,15,13,14,16,16,15,16,16,17,18,17,19,17,16,13,10,10,10,11,11,12,12,12,13,13,13,13,13,13,13,10,1,5,7,9,10,10,11,11,12,12,12,13,13,13,14,11,4,6,8,9,10,11,11,11,12,12,12,13,14,13,14,11,7,8,9,10,11,11,12,12,13,12,13,13,13,14,14,12,9,9,10,11,11,12,12,12,13,13,14,14,14,15,15,13,10,10,11,11,12,12,13,13,13,14,14,14,15,15,15,12,10,10,11,11,12,13,13,14,13,14,14,15,15,15,16,13,11,11,11,12,13,13,13,13,14,14,14,14,15,15,16,13,11,11,12,12,13,13,13,14,14,15,15,15,15,17,17,13,11,12,12,13,13,13,14,14,15,15,15,15,16,16,16,13,12,12,12,13,13,14,14,15,15,15,15,16,15,16,15,14,12,13,12,13,14,14,14,14,15,16,16,16,17,17,16,13,13,13,13,13,14,14,15,16,16,16,16,16,16,15,16,14,13,14,14,14,14,15,15,15,15,17,16,16,16,16,18,14,15,14,14,14,15,15,16,16,16,18,17,17,17,19,17,14,14,15,13,14,16,16,15,16,16,17,18,17,19,17,16,14,11,11,11,12,12,13,13,13,14,14,14,14,14,14,14,12,1,0,5,0,14,0,44,0,74,0,63,0,110,0,93,0,172,0,149,0,138,0,242,0,225,0,195,0,120,1,17,0,3,0,4,0,12,0,20,0,35,0,62,0,53,0,47,0,83,0,75,0,68,0,119,0,201,0,107,0,207,0,9,0,15,0,13,0,23,0,38,0,67,0,58,0,103,0,90,0,161,0,72,0,127,0,117,0,110,0,209,0,206,0,16,0,45,0,21,0,39,0,69,0,64,0,114,0,99,0,87,0,158,0,140,0,252,0,212,0,199,0,131,1,109,1,26,0,75,0,36,0,68,0,65,0,115,0,101,0,179,0,164,0,155,0,8,1,246,0,226,0,139,1,126,1,106,1,9,0,66,0,30,0,59,0,56,0,102,0,185,0,173,0,9,1,142,0,253,0,232,0,144,1,132,1,122,1,189,1,16,0,111,0,54,0,52,0,100,0,184,0,178,0,160,0,133,0,1,1,244,0,228,0,217,0,129,1,110,1,203,2,10,0,98,0,48,0,91,0,88,0,165,0,157,0,148,0,5,1,248,0,151,1,141,1,116,1,124,1,121,3,116,3,8,0,85,0,84,0,81,0,159,0,156,0,143,0,4,1,249,0,171,1,145,1,136,1,127,1,215,2,201,2,196,2,7,0,154,0,76,0,73,0,141,0,131,0,0,1,245,0,170,1,150,1,138,1,128,1,223,2,103,1,198,2,96,1,11,0,139,0,129,0,67,0,125,0,247,0,233,0,229,0,219,0,137,1,231,2,225,2,208,2,117,3,114,3,183,1,4,0,243,0,120,0,118,0,115,0,227,0,223,0,140,1,234,2,230,2,224,2,209,2,200,2,194,2,223,0,180,1,6,0,202,0,224,0,222,0,218,0,216,0,133,1,130,1,125,1,108,1,120,3,187,1,195,2,184,1,181,1,192,6,4,0,235,2,211,0,210,0,208,0,114,1,123,1,222,2,211,2,202,2,199,6,115,3,109,3,108,3,131,13,97,3,2,0,121,1,113,1,102,0,187,0,214,2,210,2,102,1,199,2,197,2,98,3,198,6,103,3,130,13,102,3,178,1,0,0,12,0,10,0,7,0,11,0,10,0,17,0,11,0,9,0,13,0,12,0,10,0,7,0,5,0,3,0,1,0,3,0,3,5,6,8,8,9,10,10,10,11,11,12,12,12,13,14,5,5,7,8,9,9,10,10,10,11,11,12,12,12,13,13,6,7,7,8,9,9,10,10,10,11,11,12,12,13,13,13,7,8,8,9,9,10,10,11,11,11,12,12,12,13,13,13,8,8,9,9,10,10,11,11,11,11,12,12,12,13,13,13,9,9,9,10,10,10,11,11,11,11,12,12,13,13,13,14,10,9,10,10,10,11,11,11,11,12,12,12,13,13,14,14,10,10,10,11,11,11,11,12,12,12,12,12,13,13,13,14,10,10,10,11,11,11,11,12,12,12,12,13,13,14,14,14,10,10,11,11,11,11,12,12,12,13,13,13,13,14,14,14,11,11,11,11,12,12,12,12,12,13,13,13,13,14,15,14,11,11,11,11,12,12,12,12,13,13,13,13,14,14,14,15,12,12,11,12,12,12,13,13,13,13,13,13,14,14,15,15,12,12,12,12,12,13,13,13,13,14,14,14,14,14,15,15,13,13,13,13,13,13,13,13,14,14,14,14,15,15,14,15,13,13,13,13,13,13,13,14,14,14,14,14,15,15,15,15,7,0,12,0,18,0,53,0,47,0,76,0,124,0,108,0,89,0,123,0,108,0,119,0,107,0,81,0,122,0,63,0,13,0,5,0,16,0,27,0,46,0,36,0,61,0,51,0,42,0,70,0,52,0,83,0,65,0,41,0,59,0,36,0,19,0,17,0,15,0,24,0,41,0,34,0,59,0,48,0,40,0,64,0,50,0,78,0,62,0,80,0,56,0,33,0,29,0,28,0,25,0,43,0,39,0,63,0,55,0,93,0,76,0,59,0,93,0,72,0,54,0,75,0,50,0,29,0,52,0,22,0,42,0,40,0,67,0,57,0,95,0,79,0,72,0,57,0,89,0,69,0,49,0,66,0,46,0,27,0,77,0,37,0,35,0,66,0,58,0,52,0,91,0,74,0,62,0,48,0,79,0,63,0,90,0,62,0,40,0,38,0,125,0,32,0,60,0,56,0,50,0,92,0,78,0,65,0,55,0,87,0,71,0,51,0,73,0,51,0,70,0,30,0,109,0,53,0,49,0,94,0,88,0,75,0,66,0,122,0,91,0,73,0,56,0,42,0,64,0,44,0,21,0,25,0,90,0,43,0,41,0,77,0,73,0,63,0,56,0,92,0,77,0,66,0,47,0,67,0,48,0,53,0,36,0,20,0,71,0,34,0,67,0,60,0,58,0,49,0,88,0,76,0,67,0,106,0,71,0,54,0,38,0,39,0,23,0,15,0,109,0,53,0,51,0,47,0,90,0,82,0,58,0,57,0,48,0,72,0,57,0,41,0,23,0,27,0,62,0,9,0,86,0,42,0,40,0,37,0,70,0,64,0,52,0,43,0,70,0,55,0,42,0,25,0,29,0,18,0,11,0,11,0,118,0,68,0,30,0,55,0,50,0,46,0,74,0,65,0,49,0,39,0,24,0,16,0,22,0,13,0,14,0,7,0,91,0,44,0,39,0,38,0,34,0,63,0,52,0,45,0,31,0,52,0,28,0,19,0,14,0,8,0,9,0,3,0,123,0,60,0,58,0,53,0,47,0,43,0,32,0,22,0,37,0,24,0,17,0,12,0,15,0,10,0,2,0,1,0,71,0,37,0,34,0,30,0,28,0,20,0,17,0,26,0,21,0,16,0,10,0,6,0,8,0,6,0,2,0,0,0,1,5,7,8,9,10,10,11,10,11,12,12,13,13,14,14,4,6,8,9,10,10,11,11,11,11,12,12,13,14,14,14,7,8,9,10,11,11,12,12,11,12,12,13,13,14,15,15,8,9,10,11,11,12,12,12,12,13,13,13,13,14,15,15,9,9,11,11,12,12,13,13,12,13,13,14,14,15,15,16,10,10,11,12,12,12,13,13,13,13,14,13,15,15,16,16,10,11,12,12,13,13,13,13,13,14,14,14,15,15,16,16,11,11,12,13,13,13,14,14,14,14,15,15,15,16,18,18,10,10,11,12,12,13,13,14,14,14,14,15,15,16,17,17,11,11,12,12,13,13,13,15,14,15,15,16,16,16,18,17,11,12,12,13,13,14,14,15,14,15,16,15,16,17,18,19,12,12,12,13,14,14,14,14,15,15,15,16,17,17,17,18,12,13,13,14,14,15,14,15,16,16,17,17,17,18,18,18,13,13,14,15,15,15,16,16,16,16,16,17,18,17,18,18,14,14,14,15,15,15,17,16,16,19,17,17,17,19,18,18,13,14,15,16,16,16,17,16,17,17,18,18,21,20,21,18,1,0,5,0,14,0,21,0,34,0,51,0,46,0,71,0,42,0,52,0,68,0,52,0,67,0,44,0,43,0,19,0,3,0,4,0,12,0,19,0,31,0,26,0,44,0,33,0,31,0,24,0,32,0,24,0,31,0,35,0,22,0,14,0,15,0,13,0,23,0,36,0,59,0,49,0,77,0,65,0,29,0,40,0,30,0,40,0,27,0,33,0,42,0,16,0,22,0,20,0,37,0,61,0,56,0,79,0,73,0,64,0,43,0,76,0,56,0,37,0,26,0,31,0,25,0,14,0,35,0,16,0,60,0,57,0,97,0,75,0,114,0,91,0,54,0,73,0,55,0,41,0,48,0,53,0,23,0,24,0,58,0,27,0,50,0,96,0,76,0,70,0,93,0,84,0,77,0,58,0,79,0,29,0,74,0,49,0,41,0,17,0,47,0,45,0,78,0,74,0,115,0,94,0,90,0,79,0,69,0,83,0,71,0,50,0,59,0,38,0,36,0,15,0,72,0,34,0,56,0,95,0,92,0,85,0,91,0,90,0,86,0,73,0,77,0,65,0,51,0,44,0,43,0,42,0,43,0,20,0,30,0,44,0,55,0,78,0,72,0,87,0,78,0,61,0,46,0,54,0,37,0,30,0,20,0,16,0,53,0,25,0,41,0,37,0,44,0,59,0,54,0,81,0,66,0,76,0,57,0,54,0,37,0,18,0,39,0,11,0,35,0,33,0,31,0,57,0,42,0,82,0,72,0,80,0,47,0,58,0,55,0,21,0,22,0,26,0,38,0,22,0,53,0,25,0,23,0,38,0,70,0,60,0,51,0,36,0,55,0,26,0,34,0,23,0,27,0,14,0,9,0,7,0,34,0,32,0,28,0,39,0,49,0,75,0,30,0,52,0,48,0,40,0,52,0,28,0,18,0,17,0,9,0,5,0,45,0,21,0,34,0,64,0,56,0,50,0,49,0,45,0,31,0,19,0,12,0,15,0,10,0,7,0,6,0,3,0,48,0,23,0,20,0,39,0,36,0,35,0,53,0,21,0,16,0,23,0,13,0,10,0,6,0,1,0,4,0,2,0,16,0,15,0,17,0,27,0,25,0,20,0,29,0,11,0,17,0,12,0,16,0,8,0,1,0,1,0,0,0,1,0,4,4,6,8,9,10,10,10,4,5,6,7,9,9,10,10,6,6,7,8,9,10,9,10,7,7,8,8,9,10,10,10,8,8,9,9,10,10,10,11,9,9,10,10,10,11,10,11,9,9,9,10,10,11,11,12,10,10,10,11,11,11,11,12,9,0,6,0,16,0,33,0,41,0,39,0,38,0,26,0,7,0,5,0,6,0,9,0,23,0,16,0,26,0,11,0,17,0,7,0,11,0,14,0,21,0,30,0,10,0,7,0,17,0,10,0,15,0,12,0,18,0,28,0,14,0,5,0,32,0,13,0,22,0,19,0,18,0,16,0,9,0,5,0,40,0,17,0,31,0,29,0,17,0,13,0,4,0,2,0,27,0,12,0,11,0,15,0,10,0,7,0,4,0,1,0,27,0,12,0,8,0,12,0,6,0,3,0,1,0,0,0,2,4,6,8,9,10,9,10,4,5,6,8,10,10,9,10,6,7,8,9,10,11,10,10,8,8,9,11,10,12,10,11,9,10,10,11,11,12,11,12,9,10,11,12,12,13,12,13,9,9,9,10,11,12,12,12,9,9,10,11,12,12,12,12,3,0,4,0,10,0,24,0,34,0,33,0,21,0,15,0,5,0,3,0,4,0,10,0,32,0,17,0,11,0,10,0,11,0,7,0,13,0,18,0,30,0,31,0,20,0,5,0,25,0,11,0,19,0,59,0,27,0,18,0,12,0,5,0,35,0,33,0,31,0,58,0,30,0,16,0,7,0,5,0,28,0,26,0,32,0,19,0,17,0,15,0,8,0,14,0,14,0,12,0,9,0,13,0,14,0,9,0,4,0,1,0,11,0,4,0,6,0,6,0,6,0,3,0,2,0,0,0,1,4,7,9,10,10,10,11,4,6,8,9,10,11,10,10,7,8,9,10,11,12,11,11,8,9,10,11,12,12,11,12,9,10,11,12,12,12,12,12,10,11,12,12,13,13,12,13,9,10,11,12,12,12,13,13,10,10,11,12,12,13,13,13,1,0,2,0,10,0,23,0,35,0,30,0,12,0,17,0,3,0,3,0,8,0,12,0,18,0,21,0,12,0,7,0,11,0,9,0,15,0,21,0,32,0,40,0,19,0,6,0,14,0,13,0,22,0,34,0,46,0,23,0,18,0,7,0,20,0,19,0,33,0,47,0,27,0,22,0,9,0,3,0,31,0,22,0,41,0,26,0,21,0,20,0,5,0,3,0,14,0,13,0,10,0,11,0,16,0,6,0,5,0,1,0,9,0,8,0,7,0,8,0,4,0,4,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,6,0,0,0,5,0,0,0,6,0,0,0,5,0,0,0,6,0,0,0,5,0,0,0,7,0,0,0,6,0,0,0,7,0,0,0,6,0,0,0,7,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,1,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,8,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,16,0,0,0,16,0,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,116,0,0,0,140,0,0,0,168,0,0,0,200,0,0,0,238,0,0,0,28,1,0,0,80,1,0,0,140,1,0,0,208,1,0,0,10,2,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,32,0,0,0,42,0,0,0,56,0,0,0,74,0,0,0,100,0,0,0,132,0,0,0,174,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,114,0,0,0,136,0,0,0,162,0,0,0,194,0,0,0,232,0,0,0,22,1,0,0,76,1,0,0,138,1,0,0,208,1,0,0,28,2,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,18,0,0,0,26,0,0,0,36,0,0,0,48,0,0,0,62,0,0,0,80,0,0,0,104,0,0,0,136,0,0,0,180,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,116,0,0,0,140,0,0,0,168,0,0,0,200,0,0,0,238,0,0,0,28,1,0,0,80,1,0,0,140,1,0,0,208,1,0,0,10,2,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,18,0,0,0,26,0,0,0,36,0,0,0,48,0,0,0,62,0,0,0,80,0,0,0,104,0,0,0,134,0,0,0,174,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,52,0,0,0,62,0,0,0,74,0,0,0,90,0,0,0,110,0,0,0,134,0,0,0,162,0,0,0,196,0,0,0,238,0,0,0,32,1,0,0,86,1,0,0,162,1,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,22,0,0,0,30,0,0,0,40,0,0,0,52,0,0,0,66,0,0,0,84,0,0,0,106,0,0,0,136,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,42,0,0,0,50,0,0,0,60,0,0,0,72,0,0,0,88,0,0,0,106,0,0,0,128,0,0,0,156,0,0,0,190,0,0,0,230,0,0,0,20,1,0,0,74,1,0,0,128,1,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,22,0,0,0,28,0,0,0,38,0,0,0,50,0,0,0,64,0,0,0,80,0,0,0,100,0,0,0,126,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,82,0,0,0,102,0,0,0,126,0,0,0,156,0,0,0,194,0,0,0,240,0,0,0,40,1,0,0,108,1,0,0,192,1,0,0,38,2,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,22,0,0,0,30,0,0,0,42,0,0,0,58,0,0,0,78,0,0,0,104,0,0,0,138,0,0,0,180,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,116,0,0,0,140,0,0,0,168,0,0,0,200,0,0,0,238,0,0,0,28,1,0,0,80,1,0,0,140,1,0,0,208,1,0,0,10,2,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,18,0,0,0,26,0,0,0,36,0,0,0,48,0,0,0,62,0,0,0,80,0,0,0,104,0,0,0,134,0,0,0,174,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,116,0,0,0,140,0,0,0,168,0,0,0,200,0,0,0,238,0,0,0,28,1,0,0,80,1,0,0,140,1,0,0,208,1,0,0,10,2,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,18,0,0,0,26,0,0,0,36,0,0,0,48,0,0,0,62,0,0,0,80,0,0,0,104,0,0,0,134,0,0,0,174,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,24,0,0,0,36,0,0,0,48,0,0,0,60,0,0,0,72,0,0,0,88,0,0,0,108,0,0,0,132,0,0,0,160,0,0,0,192,0,0,0,232,0,0,0,24,1,0,0,80,1,0,0,144,1,0,0,220,1,0,0,54,2,0,0,56,2,0,0,58,2,0,0,60,2,0,0,62,2,0,0,64,2,0,0,0,0,0,0,8,0,0,0,16,0,0,0,24,0,0,0,36,0,0,0,52,0,0,0,72,0,0,0,96,0,0,0,124,0,0,0,160,0,0,0,162,0,0,0,164,0,0,0,166,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,11,0,0,0,16,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,36,0,0,0,54,0,0,0,54,0,0,0,36,0,0,0,54,0,0,0,72,0,0,0,54,0,0,0,72,0,0,0,90,0,0,0,72,0,0,0,90,0,0,0,108,0,0,0,108,0,0,0,126,0,0,0,0,0,0,0,18,0,0,0,36,0,0,0,54,0,0,0,51,0,0,0,35,0,0,0,53,0,0,0,71,0,0,0,52,0,0,0,70,0,0,0,88,0,0,0,69,0,0,0,87,0,0,0,105,0,0,0,104,0,0,0,122,0,0,0,0,0,0,0,10,0,0,0,20,0,0,0,30,0,0,0,33,0,0,0,21,0,0,0,31,0,0,0,41,0,0,0,32,0,0,0,42,0,0,0,52,0,0,0,43,0,0,0,53,0,0,0,63,0,0,0,64,0,0,0,74,0,0,0,34,86,0,0,192,93,0,0,128,62,0,0,255,255,255,255,68,172,0,0,128,187,0,0,0,125,0,0,255,255,255,255,17,43,0,0,224,46,0,0,64,31,0,0,255,255,255,255,0,128,64,192,32,160,96,224,16,144,80,208,48,176,112,240,8,136,72,200,40,168,104,232,24,152,88,216,56,184,120,248,4,132,68,196,36,164,100,228,20,148,84,212,52,180,116,244,12,140,76,204,44,172,108,236,28,156,92,220,60,188,124,252,2,130,66,194,34,162,98,226,18,146,82,210,50,178,114,242,10,138,74,202,42,170,106,234,26,154,90,218,58,186,122,250,6,134,70,198,38,166,102,230,22,150,86,214,54,182,118,246,14,142,78,206,46,174,110,238,30,158,94,222,62,190,126,254,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,115,0,0,0,0,0,0,0,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,99,0,0,0,0,0,0,0,205,204,236,192,205,204,236,192,205,204,236,192,0,0,24,193,205,204,236,192,51,51,195,192,0,0,176,192,102,102,150,192,102,102,150,192,102,102,150,192,102,102,150,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,0,0,0,0,0,0,0,0,205,204,60,65,154,153,89,65,154,153,137,65,0,0,0,66,0,0,58,66,51,51,77,66,0,0,102,66,51,51,134,66,0,0,143,66,51,51,169,66,51,51,195,66,0,0,2,67,154,153,217,64,154,153,185,64,154,153,185,64,205,204,204,64,0,0,208,64,102,102,30,65,154,153,65,65,102,102,102,65,0,0,112,65,51,51,151,65,205,204,172,65,51,51,215,65,205,204,8,66,205,204,32,66,51,51,59,66,0,0,98,66,205,204,114,66,205,204,147,66,102,102,171,66,205,204,186,66,51,51,252,66,0,0,0,0,0,0,0,0,1,0,0,0,16,0,0,0,17,0,0,0,8,0,0,0,9,0,0,0,24,0,0,0,25,0,0,0,4,0,0,0,5,0,0,0,20,0,0,0,21,0,0,0,12,0,0,0,13,0,0,0,28,0,0,0,29,0,0,0,2,0,0,0,3,0,0,0,18,0,0,0,19,0,0,0,10,0,0,0,11,0,0,0,26,0,0,0,27,0,0,0,6,0,0,0,7,0,0,0,22,0,0,0,23,0,0,0,14,0,0,0,15,0,0,0,30,0,0,0,31,0,0,0,63,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,8,0,0,0,208,7,0,0,16,0,0,0,116,14,0,0,24,0,0,0,60,15,0,0,32,0,0,0,124,21,0,0,40,0,0,0,88,27,0,0,48,0,0,0,76,29,0,0,56,0,0,0,16,39,0,0,64,0,0,0,248,42,0,0,80,0,0,0,188,52,0,0,96,0,0,0,252,58,0,0,112,0,0,0,240,60,0,0,128,0,0,0,104,66,0,0,160,0,0,0,92,68,0,0,192,0,0,0,168,72,0,0,224,0,0,0,200,75,0,0,0,1,0,0,244,76,0,0,64,1,0,0,20,80,0,0,1,0,0,0,0,0,0,0,6,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0].concat([9,0,0,0,9,0,0,0,9,0,0,0,9,0,0,0,6,0,0,0,9,0,0,0,9,0,0,0,9,0,0,0,6,0,0,0,5,0,0,0,7,0,0,0,3,0,0,0,9,0,0,0,9,0,0,0,12,0,0,0,6,0,0,0,6,0,0,0,9,0,0,0,12,0,0,0,6,0,0,0,11,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,7,0,0,0,7,0,0,0,0,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,0,0,0,0,6,0,0,0,15,0,0,0,12,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,3,0,0,0,12,0,0,0,9,0,0,0,9,0,0,0,6,0,0,0,6,0,0,0,12,0,0,0,9,0,0,0,6,0,0,0,8,0,0,0,8,0,0,0,5,0,0,0,0,0,0,0,15,0,0,0,12,0,0,0,9,0,0,0,0,0,0,0,6,0,0,0,18,0,0,0,9,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,111,112,116,105,111,110,32,100,111,101,115,110,39,116,32,116,97,107,101,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,46,42,115,0,8,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,64,0,0,0,80,0,0,0,96,0,0,0,112,0,0,0,128,0,0,0,160,0,0,0,192,0,0,0,224,0,0,0,0,1,0,0,64,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,0,0,0,0,15,0,0,0,15,0,0,0,7,0,0,0,7,0,0,0,15,0,0,0,15,0,0,0,7,0,0,0,0,0,0,0,7,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,31,0,0,0,31,0,0,0,0,0,0,0,7,0,0,0,7,0,0,0,7,0,0,0,0,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,7,7,7,7,7,7,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,15,15,15,15,15,15,15,15,15,15,15,7,7,7,7,7,7,7,7,7,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,1,0,5,0,5,0,7,0,7,0,8,0,9,0,9,0,10,0,10,0,10,0,10,0,11,0,11,0,11,0,11,0,12,0,12,0,12,0,12,0,12,0,12,0,13,0,12,0,13,0,12,0,13,0,13,0,14,0,10,0,10,0,5,0,4,0,6,0,6,0,7,0,8,0,8,0,9,0,9,0,10,0,10,0,11,0,10,0,11,0,11,0,11,0,11,0,12,0,11,0,12,0,12,0,12,0,12,0,13,0,12,0,14,0,12,0,13,0,12,0,14,0,10,0,10,0,7,0,7,0,7,0,8,0,8,0,9,0,9,0,10,0,9,0,11,0,10,0,11,0,10,0,12,0,11,0,12,0,11,0,13,0,11,0,12,0,11,0,13,0,12,0,13,0,12,0,13,0,12,0,14,0,13,0,14,0,9,0,11,0,8,0,9,0,8,0,9,0,9,0,10,0,9,0,11,0,10,0,11,0,10,0,12,0,10,0,12,0,11,0,12,0,11,0,13,0,11,0,13,0,11,0,14,0,12,0,14,0,12,0,14,0,12,0,15,0,12,0,15,0,9,0,12,0,9,0,10,0,9,0,10,0,9,0,11,0,10,0,11,0,10,0,12,0,10,0,12,0,10,0,13,0,11,0,13,0,11,0,13,0,11,0,14,0,12,0,14,0,12,0,14,0,12,0,15,0,12,0,15,0,13,0,15,0,9,0,11,0,10,0,10,0,9,0,10,0,10,0,11,0,10,0,11,0,10,0,12,0,10,0,13,0,11,0,13,0,11,0,14,0,11,0,13,0,11,0,14,0,12,0,14,0,12,0,15,0,12,0,15,0,12,0,15,0,12,0,16,0,9,0,12,0,10,0,11,0,10,0,11,0,10,0,11,0,10,0,12,0,10,0,13,0,11,0,13,0,11,0,13,0,11,0,13,0,11,0,14,0,12,0,14,0,12,0,14,0,12,0,14,0,12,0,15,0,12,0,15,0,13,0,16,0,9,0,12,0,11,0,11,0,10,0,11,0,10,0,12,0,10,0,12,0,11,0,13,0,11,0,13,0,11,0,13,0,11,0,14,0,12,0,14,0,12,0,15,0,12,0,15,0,12,0,15,0,12,0,15,0,13,0,17,0,13,0,17,0,10,0,12,0,11,0,11,0,11,0,12,0,11,0,12,0,11,0,13,0,11,0,13,0,11,0,13,0,11,0,14,0,11,0,14,0,11,0,15,0,12,0,15,0,12,0,15,0,12,0,15,0,12,0,16,0,13,0,16,0,13,0,16,0,10,0,12,0,11,0,12,0,11,0,12,0,11,0,12,0,11,0,13,0,11,0,13,0,11,0,14,0,11,0,14,0,12,0,15,0,12,0,15,0,12,0,15,0,12,0,15,0,12,0,16,0,13,0,15,0,13,0,16,0,13,0,15,0,10,0,13,0,12,0,12,0,11,0,13,0,11,0,12,0,11,0,13,0,11,0,14,0,12,0,14,0,12,0,14,0,12,0,14,0,12,0,15,0,12,0,16,0,12,0,16,0,13,0,16,0,13,0,17,0,13,0,17,0,13,0,16,0,10,0,12,0,12,0,13,0,12,0,13,0,11,0,13,0,11,0,13,0,11,0,14,0,12,0,14,0,12,0,15,0,12,0,16,0,12,0,16,0,12,0,16,0,12,0,16,0,13,0,16,0,13,0,16,0,13,0,15,0,13,0,16,0,10,0,13,0,12,0,13,0,12,0,14,0,12,0,14,0,12,0,14,0,12,0,14,0,12,0,15,0,12,0,15,0,12,0,15,0,12,0,15,0,12,0,17,0,13,0,16,0,13,0,16,0,13,0,16,0,13,0,16,0,13,0,18,0,10,0,13,0,12,0,15,0,12,0,14,0,12,0,14,0,12,0,14,0,12,0,15,0,12,0,15,0,12,0,16,0,12,0,16,0,13,0,16,0,13,0,18,0,13,0,17,0,13,0,17,0,13,0,17,0,13,0,19,0,13,0,17,0,10,0,13,0,13,0,14,0,12,0,15,0,12,0,13,0,12,0,14,0,12,0,16,0,12,0,16,0,12,0,15,0,13,0,16,0,13,0,16,0,13,0,17,0,13,0,18,0,13,0,17,0,13,0,19,0,13,0,17,0,13,0,16,0,10,0,13,0,9,0,10,0,9,0,10,0,9,0,10,0,9,0,11,0,9,0,11,0,9,0,12,0,9,0,12,0,9,0,12,0,9,0,13,0,9,0,13,0,9,0,13,0,10,0,13,0,10,0,13,0,10,0,13,0,10,0,13,0,6,0,10,0,44,76,0,0,56,74,0,0,68,72,0,0,80,70,0,0,92,68,0,0,116,64,0,0,140,60,0,0,164,56,0,0,212,48,0,0,28,37,0,0,110,15,0,0,0,0,0,0,192,93,0,0,44,76,0,0,68,72,0,0,80,70,0,0,92,68,0,0,104,66,0,0,116,64,0,0,240,60,0,0,96,59,0,0,62,28,0,0,110,15,0,0,0,0,0,0,44,76,0,0,56,74,0,0,168,72,0,0,80,70,0,0,92,68,0,0,128,62,0,0,240,60,0,0,52,58,0,0,212,48,0,0,16,39,0,0,110,15,0,0,0,0,0,0,128,187,0,0,0,0,0,0,0,0,208,64,0,0,0,0,0,0,208,64,148,92,0,0,68,172,0,0,0,0,0,0,0,0,208,64,0,0,0,0,0,0,208,64,20,85,0,0,0,125,0,0,0,0,208,64,0,0,0,65,102,102,166,64,0,0,208,64,184,61,0,0,192,93,0,0,0,0,0,65,0,0,8,65,102,102,166,64,0,0,192,64,74,46,0,0,34,86,0,0,0,0,8,65,246,40,16,65,102,102,166,64,0,0,208,64,140,42,0,0,128,62,0,0,246,40,16,65,102,102,22,65,205,204,156,64,0,0,208,64,223,30,0,0,224,46,0,0,102,102,22,65,154,153,25,65,0,0,144,64,0,0,192,64,40,23,0,0,17,43,0,0,154,153,25,65,102,102,30,65,51,51,163,64,0,0,208,64,70,21,0,0,64,31,0,0,102,102,30,65,0,0,32,65,205,204,156,64,0,0,208,64,112,15,0,0,102,102,182,64,0,0,208,64,154,153,233,64,51,51,3,65,0,0,32,65,102,102,62,65,0,0,80,65,0,0,96,65,0,0,112,65,0,0,132,65,0,0,0,0,0,0,0,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,45,45,32,37,115,0,0,0,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,45,45,32,37,99,0,0,0,0,1,0,0,0,2,0,0,0,5,0,0,0,7,0,0,0,7,0,0,0,10,0,0,0,10,0,0,0,13,0,0,0,13,0,0,0,13,0,0,0,13,0,0,0,13,0,0,0,13,0,0,0,13,0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,63,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,255,3,0,0,0,0,0,0,0,0,0,0,13,0,0,0,255,31,0,0,0,0,0,0,0,0,0,0,4,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,63,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,127,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,255,1,0,0,0,0,0,0,0,0,0,0,11,0,0,0,255,7,0,0,0,0,0,0,0,0,0,0,13,0,0,0,255,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,123,0,0,0,34,0,0,0,74,0,0,0,73,0,0,0,99,0,0,0,20,0,0,0,40,0,0,0,26,0,0,0,145,0,0,0,90,0,0,0,116,0,0,0,41,0,0,0,135,0,0,0,85,0,0,0,96,0,0,0,138,0,0,0,89,0,0,0,0,0,0,0,107,0,0,0,132,0,0,0,65,0,0,0,88,0,0,0,104,0,0,0,102,0,0,0,97,0,0,0,136,0,0,0,61,0,0,0,141,0,0,0,32,0,0,0,1,0,0,0,112,0,0,0,128,0,0,0,57,0,0,0,140,0,0,0,2,0,0,0,139,0,0,0,58,0,0,0,3,0,0,0,125,0,0,0,50,0,0,0,22,0,0,0,4,0,0,0,55,0,0,0,127,0,0,0,122,0,0,0,120,0,0,0,98,0,0,0,52,0,0,0,48,0,0,0,54,0,0,0,124,0,0,0,25,0,0,0,84,0,0,0,80,0,0,0,115,0,0,0,81,0,0,0,119,0,0,0,5,0,0,0,30,0,0,0,36,0,0,0,59,0,0,0,126,0,0,0,38,0,0,0,49,0,0,0,91,0,0,0,6,0,0,0,129,0,0,0,79,0,0,0,137,0,0,0,7,0,0,0,35,0,0,0,100,0,0,0,131,0,0,0,19,0,0,0,33,0,0,0,46,0,0,0,47,0,0,0,8,0,0,0,29,0,0,0,146,0,0,0,63,0,0,0,86,0,0,0,71,0,0,0,45,0,0,0,142,0,0,0,9,0,0,0,77,0,0,0,82,0,0,0,64,0,0,0,133,0,0,0,10,0,0,0,66,0,0,0,39,0,0,0,11,0,0,0,103,0,0,0,12,0,0,0,75,0,0,0,134,0,0,0,13,0,0,0,53,0,0,0,62,0,0,0,109,0,0,0,117,0,0,0,23,0,0,0,108,0,0,0,92,0,0,0,67,0,0,0,93,0,0,0,43,0,0,0,121,0,0,0,15,0,0,0,68,0,0,0,14,0,0,0,16,0,0,0,76,0,0,0,87,0,0,0,118,0,0,0,17,0,0,0,78,0,0,0,143,0,0,0,114,0,0,0,110,0,0,0,69,0,0,0,21,0,0,0,111,0,0,0,95,0,0,0,105,0,0,0,42,0,0,0,37,0,0,0,24,0,0,0,56,0,0,0,44,0,0,0,101,0,0,0,83,0,0,0,94,0,0,0,106,0,0,0,147,0,0,0,113,0,0,0,18,0,0,0,51,0,0,0,130,0,0,0,144,0,0,0,60,0,0,0,70,0,0,0,31,0,0,0,72,0,0,0,27,0,0,0,28,0,0,0,121,207,23,190,138,59,1,66,164,51,148,67,155,200,92,68,202,167,45,70,175,40,132,68,192,222,152,67,129,155,246,65,199,156,118,64,77,183,109,66,194,101,49,68,74,15,165,69,82,45,182,197,71,104,76,196,73,213,153,194,66,4,147,192,94,6,104,63,54,189,72,62,3,97,30,190,44,76,9,66,68,231,150,67,96,102,76,68,47,215,52,70,17,168,147,68,117,204,160,67,46,219,249,65,68,124,109,64,146,154,86,66,183,10,43,68,136,68,163,69,35,243,198,197,129,62,99,196,80,169,179,194,43,42,173,192,1,24,82,63,194,197,199,62,223,144,36,190,144,150,16,66,32,15,152,67,140,47,55,68,113,86,59,70,101,128,162,68,120,164,167,67,193,231,251,65,149,237,87,64,209,237,60,66,46,47,35,68,80,99,160,69,178,232,215,197,240,127,122,196,100,62,207,194,121,91,195,192,207,220,61,63,49,160,20,63,61,91,42,190,177,1,23,66,106,129,151,67,98,254,28,68,14,27,65,70,229,136,176,68,246,95,173,67,75,201,252,65,52,59,74,64,173,80,34,66,178,10,26,68,170,126,156,69,83,240,232,197,121,249,136,196,253,124,236,194,231,48,218,192,193,13,43,63,21,239,67,63,139,188,47,190,75,118,28,66,177,43,149,67,81,195,251,67,92,30,70,70,161,146,189,68,23,254,177,67,116,41,251,65,165,166,58,64,77,48,7,66,62,185,15,68,225,169,151,69,144,236,249,197,102,184,148,196,253,164,5,195,130,12,247,192,196,112,25,63,234,90,113,63,120,177,52,190,11,224,32,66,197,255,144,67,75,169,179,67,9,89,74,70,63,131,201,68,227,108,181,67,12,94,248,65,73,159,52,64,49,233,215,65,148,121,4,68,250,250,145,69,153,95,5,198,224,82,160,196,230,149,21,195,193,75,10,193,185,213,8,63,218,57,142,63,244,54,185,190,93,45,36,66,238,197,138,67,123,163,67,67,193,197,77,70,150,52,212,68,118,180,183,67,208,116,244,65,169,3,34,64,173,143,160,65,68,192,240,67,195,135,139,69,122,165,13,198,28,180,171,196,130,42,38,195,136,83,25,193,112,40,242,62,153,103,162,63,55,74,189,190,167,146,37,66,148,165,130,67,182,247,78,65,135,96,80,70,71,144,221,68,247,225,184,67,182,2,238,65,153,191,25,64,113,224,84,65,226,71,215,67,116,104,132,69,186,183,21,198,32,182,182,196,153,32,55,195,248,124,43,193,205,19,212,62,243,4,181,63,187,232,192,190,91,122,38,66,227,13,113,67,88,242,59,195,65,40,82,70,237,132,229,68,213,190,184,67,201,3,232,65,16,147,4,64,105,242,216,64,110,227,188,67,47,102,121,69,214,134,29,198,81,62,193,196,85,96,72,195,235,212,61,193,80,50,183,62,3,228,197,63,71,16,196,190,73,155,36,66,18,122,88,67,23,20,203,195,140,28,83,70,216,249,235,68,185,166,183,67,247,22,225,65,11,250,244,63,71,16,196,62,69,237,161,67,91,2,105,69,239,4,37,198,124,38,203,196,16,160,89,195,54,63,80,193,66,80,155,62,49,219,212,63,46,15,21,191,242,108,33,66,98,51,60,67,83,17,32,196,220,60,83,70,70,243,240,68,238,104,181,67,38,192,215,65,112,137,223,63,88,12,180,192,157,166,134,67,47,214,87,69,149,32,44,198,6,85,212,196,16,196,106,195,193,157,98,193,212,63,128,62,152,197,225,63,57,182,22,191,234,239,28,66,206,194,27,67,244,79,94,196,226,141,82,70,182,97,244,68,249,56,178,67,221,40,207,65,124,229,200,63,57,233,50,193,16,207,86,67,160,18,70,69,73,205,50,198,21,165,220,196,104,176,123,195,1,246,119,193,175,175,75,62,94,131,236,63,230,143,74,191,36,147,21,66,35,102,239,66,16,227,143,196,201,17,81,70,166,76,246,68,130,2,174,67,22,218,197,65,28,72,177,63,12,95,131,193,224,12,33,67,81,229,51,69,247,251,56,198,140,255,227,196,139,36,134,195,184,137,134,193,100,229,23,62,11,250,244,63,223,202,75,191,201,237,12,66,223,9,160,66,174,0,178,196,45,207,78,70,187,185,246,68,213,254,168,67,51,80,186,65,197,91,178,63,32,204,168,193,139,247,216,66,54,123,33,69,232,158,62,198,230,72,234,196,148,31,142,195,218,232,144,193,220,181,201,61,190,20,251,63,15,177,127,191,152,64,2,66,94,213,19,66,106,66,213,196,38,205,75,70,66,172,245,68,70,55,163,67,112,102,177,65,251,108,153,63,81,248,202,193,231,35,102,66,180,6,15,69,179,170,67,198,226,90,239,196,151,161,149,195,66,6,155,193,60,57,73,61,109,196,254,63,54,211,37,70,68,177,165,69,175,113,104,68,69,51,54,68,128,12,144,67,180,213,129,66,2,0,241,65,34,63,131,64,49,19,72,70,167,49,243,68,86,182,156,67,170,105,166,65,251,100,249,68,112,3,16,65,17,158,233,193,0,0,0,0,0,0,0,0,128,1,0,0,128,4,0,0,128,4,0,0,0,0,0,0,128,1,0,0,128,4,0,0,64,2,0,0,0,0,0,0,193,192,0,0,129,193,0,0,64,1,0,0,1,195,0,0,192,3,0,0,128,2,0,0,65,194,0,0,1,198,0,0,192,6,0,0,128,7,0,0,65,199,0,0,0,5,0,0,193,197,0,0,129,196,0,0,64,4,0,0,1,204,0,0,192,12,0,0,128,13,0,0,65,205,0,0,0,15,0,0,193,207,0,0,129,206,0,0,64,14,0,0,0,10,0,0,193,202,0,0,129,203,0,0,64,11,0,0,1,201,0,0,192,9,0,0,128,8,0,0,65,200,0,0,1,216,0,0,192,24,0,0,128,25,0,0,65,217,0,0,0,27,0,0,193,219,0,0,129,218,0,0,64,26,0,0,0,30,0,0,193,222,0,0,129,223,0,0,64,31,0,0,1,221,0,0,192,29,0,0,128,28,0,0,65,220,0,0,0,20,0,0,193,212,0,0,129,213,0,0,64,21,0,0,1,215,0,0,192,23,0,0,128,22,0,0,65,214,0,0,1,210,0,0,192,18,0,0,128,19,0,0,65,211,0,0,0,17,0,0,193,209,0,0,129,208,0,0,64,16,0,0,1,240,0,0,192,48,0,0,128,49,0,0,65,241,0,0,0,51,0,0,193,243,0,0,129,242,0,0,64,50,0,0,0,54,0,0,193,246,0,0,129,247,0,0,64,55,0,0,1,245,0,0,192,53,0,0,128,52,0,0,65,244,0,0,0,60,0,0,193,252,0,0,129,253,0,0,64,61,0,0,1,255,0,0,192,63,0,0,128,62,0,0,65,254,0,0,1,250,0,0,192,58,0,0,128,59,0,0,65,251,0,0,0,57,0,0,193,249,0,0,129,248,0,0,64,56,0,0,0,40,0,0,193,232,0,0,129,233,0,0,64,41,0,0,1,235,0,0,192,43,0,0,128,42,0,0,65,234,0,0,1,238,0,0,192,46,0,0,128,47,0,0,65,239,0,0,0,45,0,0,193,237,0,0,129,236,0,0,64,44,0,0,1,228,0,0,192,36,0,0,128,37,0,0,65,229,0,0,0,39,0,0,193,231,0,0,129,230,0,0,64,38,0,0,0,34,0,0,193,226,0,0,129,227,0,0,64,35,0,0,1,225,0,0,192,33,0,0,128,32,0,0,65,224,0,0,1,160,0,0,192,96,0,0,128,97,0,0,65,161,0,0,0,99,0,0,193,163,0,0,129,162,0,0,64,98,0,0,0,102,0,0,193,166,0,0,129,167,0,0,64,103,0,0,1,165,0,0,192,101,0,0,128,100,0,0,65,164,0,0,0,108,0,0,193,172,0,0,129,173,0,0,64,109,0,0,1,175,0,0,192,111,0,0,128,110,0,0,65,174,0,0,1,170,0,0,192,106,0,0,128,107,0,0,65,171,0,0,0,105,0,0,193,169,0,0,129,168,0,0,64,104,0,0,0,120,0,0,193,184,0,0,129,185,0,0,64,121,0,0,1,187,0,0,192,123,0,0,128,122,0,0,65,186,0,0,1,190,0,0,192,126,0,0,128,127,0,0,65,191,0,0,0,125,0,0,193,189,0,0,129,188,0,0,64,124,0,0,1,180,0,0,192,116,0,0,128,117,0,0,65,181,0,0,0,119,0,0,193,183,0,0,129,182,0,0,64,118,0,0,0,114,0,0,193,178,0,0,129,179,0,0,64,115,0,0,1,177,0,0,192,113,0,0,128,112,0,0,65,176,0,0,0,80,0,0,193,144,0,0,129,145,0,0,64,81,0,0,1,147,0,0,192,83,0,0,128,82,0,0,65,146,0,0,1,150,0,0,192,86,0,0,128,87,0,0,65,151,0,0,0,85,0,0,193,149,0,0,129,148,0,0,64,84,0,0,1,156,0,0,192,92,0,0,128,93,0,0,65,157,0,0,0,95,0,0,193,159,0,0,129,158,0,0,64,94,0,0,0,90,0,0,193,154,0,0,129,155,0,0,64,91,0,0,1,153,0,0,192,89,0,0,128,88,0,0,65,152,0,0,1,136,0,0,192,72,0,0,128,73,0,0,65,137,0,0,0,75,0,0,193,139,0,0,129,138,0,0,64,74,0,0,0,78,0,0,193,142,0,0,129,143,0,0,64,79,0,0,1,141,0,0,192,77,0,0,128,76,0,0,65,140,0,0,0,68,0,0,193,132,0,0,129,133,0,0,64,69,0,0,1,135,0,0,192,71,0,0,128,70,0,0,65,134,0,0,1,130,0,0,192,66,0,0,128,67,0,0,65,131,0,0,0,65,0,0,193,129,0,0,129,128,0,0,64,64,0,0,34,0,0,0,40,0,0,0,10,0,0,0,10,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,94,131,108,63,21,239,195,62,109,196,126,63,54,189,200,61,67,236,127,63,176,10,201,60,196,254,127,63,136,15,201,59,0,0,0,0,8,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,64,0,0,0,80,0,0,0,96,0,0,0,112,0,0,0,128,0,0,0,144,0,0,0,160,0,0,0,255,255,255,255,0,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,64,0,0,0,80,0,0,0,96,0,0,0,112,0,0,0,128,0,0,0,160,0,0,0,192,0,0,0,224,0,0,0,0,1,0,0,64,1,0,0,255,255,255,255,0,0,0,0,8,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,64,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,8,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,240,193,0,0,48,65,82,73,157,58,1,0,0,0,16,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,200,193,0,0,48,65,111,18,131,58,1,0,0,0,24,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,160,193,0,0,48,65,111,18,131,58,1,0,0,0,32,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,112,193,0,0,48,65,111,18,131,58,1,0,0,0,40,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,32,193,0,0,48,65,250,237,107,58,1,0,0,0,48,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,32,193,0,0,48,65,250,237,107,58,1,0,0,0,56,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,192,192,0,0,48,65,23,183,81,58,1,0,0,0,64,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,0,192,0,0,48,65,23,183,81,58,1,0,0,0,80,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,0,0,0,0,0,65,52,128,55,58,1,0,0,0,96,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,32,64,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,128,63,0,0,176,64,82,73,29,58,1,0,0,0,112,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,0,0,16,64,51,51,211,64,0,0,17,67,51,51,115,63,0,0,0,0,0,0,0,64,0,0,144,64,111,18,3,58,1,0,0,0,128,0,0,0,9,0,0,0,9,0,0,0,0,0,0,0,154,153,249,63,205,204,204,64,0,0,12,67,51,51,115,63,0,0,0,0,0,0,64,64,0,0,128,64,23,183,81,57,1,0,0,0,160,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,184,30,229,63,0,0,192,64,0,0,7,67,51,51,115,63,0,0,0,192,0,0,160,64,0,0,96,64,0,0,0,0,1,0,0,0,192,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,82,184,190,63,51,51,179,64,0,0,250,66,236,81,120,63,0,0,128,192,0,0,224,64,0,0,64,64,0,0,0,0,0,0,0,0,224,0,0,0,9,0,0,0,9,0,0,0,1,0,0,0,0,0,160,63,102,102,166,64,0,0,250,66,72,225,122,63,0,0,192,192,0,0,16,65,0,0,0,64,0,0,0,0,0,0,0,0,0,1,0,0,9,0,0,0,9,0,0,0,1,0,0,0,236,81,120,63,102,102,166,64,0,0,250,66,0,0,128,63,0,0,0,193,0,0,32,65,0,0,128,63,0,0,0,0,0,0,0,0,64,1,0,0,9,0,0,0,9,0,0,0,1,0,0,0,102,102,102,63,102,102,166,64,0,0,250,66,0,0,128,63,0,0,32,193,0,0,64,65,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,97,109,98,105,103,117,111,117,115,32,111,112,116,105,111,110,32,45,45,32,37,46,42,115,0,0,0,0,0,0,0,0,67,101,108,116,105,99,0,0,82,101,118,105,118,97,108,0,76,97,116,105,110,0,0,0,66,101,98,111,98,0,0,0,70,97,115,116,32,70,117,115,105,111,110,0,0,0,0,0,37,115,58,32,0,0,0,0,83,119,105,110,103,0,0,0,78,97,116,105,111,110,97,108,32,70,111,108,107,0,0,0,87,97,114,110,105,110,103,58,32,104,105,103,104,112,97,115,115,32,102,105,108,116,101,114,32,100,105,115,97,98,108,101,100,46,32,32,104,105,103,104,112,97,115,115,32,102,114,101,113,117,101,110,99,121,32,116,111,111,32,115,109,97,108,108,10,0,0,0,0,0,0,0,70,111,108,107,45,82,111,99,107,0,0,0,0,0,0,0,69,114,114,111,114,58,32,99,97,110,39,116,32,97,108,108,111,99,97,116,101,32,105,110,95,98,117,102,102,101,114,32,98,117,102,102,101,114,10,0,70,111,108,107,0,0,0,0,69,114,114,111,114,58,32,99,111,117,108,100,32,110,111,116,32,117,112,100,97,116,101,32,76,65,77,69,32,116,97,103,44,32,102,105,108,101,32,110,111,116,32,114,101,97,100,97,98,108,101,46,10,0,0,0,72,97,114,100,32,82,111,99,107,0,0,0,0,0,0,0,76,65,77,69,32,37,115,32,118,101,114,115,105,111,110,32,37,115,32,40,37,115,41,0,69,114,114,111,114,58,32,99,111,117,108,100,32,110,111,116,32,117,112,100,97,116,101,32,76,65,77,69,32,116,97,103,44,32,102,105,108,101,32,110,111,116,32,115,101,101,107,97,98,108,101,46,10,0,0,0,82,111,99,107,32,38,32,82,111,108,108,0,0,0,0,0,69,114,114,111,114,58,32,99,111,117,108,100,32,110,111,116,32,117,112,100,97,116,101,32,76,65,77,69,32,116,97,103,46,10,0,0,0,0,0,0,77,117,115,105,99,97,108,0,10,0,0,0,0,0,0,0,82,101,116,114,111,0,0,0,9,105,110,116,101,114,99,104,97,110,110,101,108,32,109,97,115,107,105,110,103,32,114,97,116,105,111,58,32,37,103,10,0,0,0,0,0,0,0,0,80,111,108,107,97,0,0,0,9,117,115,105,110,103,32,116,101,109,112,111,114,97,108,32,109,97,115,107,105,110,103,32,101,102,102,101,99,116,58,32,37,115,10,0,0,0,0,0,65,99,105,100,32,74,97,122,122,0,0,0,0,0,0,0,110,111,0,0,0,0,0,0,65,99,105,100,32,80,117,110,107,0,0,0,0,0,0,0,121,101,115,0,0,0,0,0,84,114,105,98,97,108,0,0,9,32,32,32,97,100,106,117,115,116,32,109,97,115,107,105,110,103,32,98,97,115,115,61,37,103,32,100,66,44,32,97,108,116,111,61,37,103,32,100,66,44,32,116,114,101,98,108,101,61,37,103,32,100,66,44,32,115,102,98,50,49,61,37,103,32,100,66,10,0,0,0,76,111,45,70,105,0,0,0,9,101,120,112,101,114,105,109,101,110,116,97,108,32,112,115,121,32,116,117,110,105,110,103,115,32,98,121,32,78,97,111,107,105,32,83,104,105,98,97,116,97,10,0,0,0,0,0,84,114,97,105,108,101,114,0,9,32,94,32,97,100,106,117,115,116,32,115,101,110,115,105,116,105,118,105,116,121,32,112,111,119,101,114,58,32,37,102,10,0,0,0,0,0,0,0,83,104,111,119,116,117,110,101,115,0,0,0,0,0,0,0,37,108,117,0,0,0,0,0,9,32,94,32,97,100,106,117,115,116,32,116,121,112,101,58,32,37,100,10,0,0,0,0,82,97,118,101,0,0,0,0,9,32,94,32,108,101,118,101,108,32,97,100,106,117,115,116,101,109,101,110,116,58,32,37,103,32,100,66,10,0,0,0,80,115,121,99,104,101,100,101,108,105,99,0,0,0,0,0,32,40,111,110,108,121,32,102,111,114,32,116,121,112,101,32,52,41,0,0,0,0,0,0,78,101,119,32,87,97,118,101,0,0,0,0,0,0,0,0,9,32,94,32,115,104,97,112,101,58,32,37,103,37,115,10,0,0,0,0,0,0,0,0,67,97,98,97,114,101,116,0,9,32,94,32,116,121,112,101,58,32,37,100,10,0,0,0,78,97,116,105,118,101,32,85,83,0,0,0,0,0,0,0,9,65,84,72,58,32,37,115,10,0,0,0,0,0,0,0,74,117,110,103,108,101,0,0,110,111,116,32,117,115,101,100,0,0,0,0,0,0,0,0,80,111,112,47,70,117,110,107,0,0,0,0,0,0,0,0,116,104,101,32,111,110,108,121,32,109,97,115,107,105,110,103,0,0,0,0,0,0,0,0,67,104,114,105,115,116,105,97,110,32,82,97,112,0,0,0,37,100,0,0,0,0,0,0,51,68,78,111,119,33,0,0,116,104,101,32,111,110,108,121,32,109,97,115,107,105,110,103,32,102,111,114,32,115,104,111,114,116,32,98,108,111,99,107,115,0,0,0,0,0,0,0,84,111,112,32,52,48,0,0,117,115,105,110,103,0,0,0,71,97,110,103,115,116,97,0,69,114,114,111,114,58,32,77,65,88,95,72,69,65,68,69,82,95,66,85,70,32,116,111,111,32,115,109,97,108,108,32,105,110,32,98,105,116,115,116,114,101,97,109,46,99,32,10,0,0,0,0,0,0,0,0,9,32,94,32,115,116,111,112,112,105,110,103,58,32,37,100,10,0,0,0,0,0,0,0,67,117,108,116,0,0,0,0,9,32,94,32,97,109,112,108,105,102,105,99,97,116,105,111,110,58,32,37,100,10,0,0,67,111,109,101,100,121,0,0,9,110,111,105,115,101,32,115,104,97,112,105,110,103,58,32,37,100,10,0,0,0,0,0,83,111,117,116,104,101,114,110,32,82,111,99,107,0,0,0,9,32,94,32,99,111,109,112,97,114,105,115,111,110,32,115,104,111,114,116,32,98,108,111,99,107,115,58,32,37,100,10,0,0,0,0,0,0,0,0,68,114,101,97,109,0,0,0,9,113,117,97,110,116,105,122,97,116,105,111,110,32,99,111,109,112,97,114,105,115,111,110,58,32,37,100,10,0,0,0,69,117,114,111,100,97,110,99,101,0,0,0,0,0,0,0,51,50,98,105,116,115,0,0,9,97,100,106,117,115,116,32,109,97,115,107,105,110,103,32,115,104,111,114,116,58,32,37,103,32,100,66,10,0,0,0,80,111,112,45,70,111,108,107,0,0,0,0,0,0,0,0,9,97,100,106,117,115,116,32,109,97,115,107,105,110,103,58,32,37,103,32,100,66,10,0,69,108,101,99,116,114,111,110,105,99,0,0,0,0,0,0,9,115,117,98,98,108,111,99,107,32,103,97,105,110,58,32,37,100,10,0,0,0,0,0,84,101,99,104,110,111,45,73,110,100,117,115,116,114,105,97,108,0,0,0,0,0,0,0,105,109,97,103,101,47,103,105,102,0,0,0,0,0,0,0,9,117,115,105,110,103,32,115,104,111,114,116,32,98,108,111,99,107,115,58,32,37,115,10,0,0,0,0,0,0,0,0,68,97,114,107,119,97,118,101,0,0,0,0,0,0,0,0,102,111,114,99,101,100,0,0,71,111,116,104,105,99,0,0,32,49,37,37,32,32,98,117,103,32,105,110,32,76,65,77,69,32,101,110,99,111,100,105,110,103,32,108,105,98,114,97,114,121,0,0,0,0,0,0,100,105,115,112,101,110,115,101,100,0,0,0,0,0,0,0,69,116,104,110,105,99,0,0,99,104,97,110,110,101,108,32,99,111,117,112,108,101,100,0,73,110,115,116,114,117,109,101,110,116,97,108,32,82,111,99,107,0,0,0,0,0,0,0,97,108,108,111,119,101,100,0,73,110,115,116,114,117,109,101,110,116,97,108,32,80,111,112,0,0,0,0,0,0,0,0,10,112,115,121,99,104,111,97,99,111,117,115,116,105,99,58,10,10,0,0,0,0,0,0,77,101,100,105,116,97,116,105,118,101,0,0,0,0,0,0,9,117,115,105,110,103,32,76,65,77,69,32,84,97,103,10,0,0,0,0,0,0,0,0,83,112,97,99,101,0,0,0,80,79,83,73,88,76,89,95,67,79,82,82,69,67,84,0,9,32,63,63,32,111,111,112,115,44,32,115,111,109,101,32,110,101,119,32,111,110,101,32,63,63,32,10,0,0,0,0,80,117,110,107,0,0,0,0,9,118,97,114,105,97,98,108,101,32,98,105,116,114,97,116,101,32,45,32,86,66,82,32,109,116,114,104,32,37,115,10,0,0,0,0,0,0,0,0,83,111,117,108,0,0,0,0,9,118,97,114,105,97,98,108,101,32,98,105,116,114,97,116,101,32,45,32,86,66,82,32,109,116,32,37,115,10,0,0,66,97,115,115,0,0,0,0,105,109,97,103,101,47,112,110,103,0,0,0,0,0,0,0,9,118,97,114,105,97,98,108,101,32,98,105,116,114,97,116,101,32,45,32,86,66,82,32,114,104,32,37,115,10,0,0,65,108,116,101,114,110,97,116,105,118,101,32,82,111,99,107,0,0,0,0,0,0,0,0,9,118,97,114,105,97,98,108,101,32,98,105,116,114,97,116,101,32,45,32,65,66,82,32,37,115,10,0,0,0,0,0,78,111,105,115,101,0,0,0,32,57,37,37,32,32,89,111,117,114,32,115,121,115,116,101,109,32,105,115,32,111,118,101,114,99,108,111,99,107,101,100,0,0,0,0,0,0,0,0,9,99,111,110,115,116,97,110,116,32,98,105,116,114,97,116,101,32,45,32,67,66,82,32,37,115,10,0,0,0,0,0,71,111,115,112,101,108,0,0,40,102,114,101,101,32,102,111,114,109,97,116,41,0,0,0,83,111,117,110,100,32,67,108,105,112,0,0,0,0,0,0,40,100,101,102,97,117,108,116,41,0,0,0,0,0,0,0,71,97,109,101,0,0,0,0,9,112,97,100,100,105,110,103,58,32,37,115,10,0,0,0,72,111,117,115,101,0,0,0,109,97,120,32,115,121,115,116,101,109,32,98,121,116,101,115,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,97,108,108,0,0,0,0,0,65,99,105,100,0,0,0,0,104,116,116,112,58,47,47,108,97,109,101,46,115,102,46,110,101,116,0,0,0,0,0,0,111,102,102,0,0,0,0,0,51,46,57,57,46,53,0,0,73,110,115,116,114,117,109,101,110,116,97,108,0,0,0,0,73,78,84,69,82,78,65,76,32,69,82,82,79,82,32,73,78,32,86,66,82,32,78,69,87,32,67,79,68,69,32,40,49,51,49,51,41,44,32,112,108,101,97,115,101,32,115,101,110,100,32,98,117,103,32,114,101,112,111,114,116,10,109,97,120,98,105,116,115,61,37,100,32,117,115,101,100,98,105,116,115,61,37,100,10,0,0,0,9,37,100,32,99,104,97,110,110,101,108,32,45,32,37,115,10,0,0,0,0,0,0,0,67,108,97,115,115,105,99,97,108,0,0,0,0,0,0,0,117,110,107,110,111,119,110,32,40,101,114,114,111,114,41,0,84,114,97,110,99,101,0,0,44,32,0,0,0,0,0,0,105,109,97,103,101,47,106,112,101,103,0,0,0,0,0,0,110,111,116,32,115,101,116,32,40,101,114,114,111,114,41,0,70,117,115,105,111,110,0,0,109,111,110,111,0,0,0,0,74,97,122,122,43,70,117,110,107,0,0,0,0,0,0,0,57,48,37,37,32,32,76,65,77,69,32,99,111,109,112,105,108,101,100,32,119,105,116,104,32,98,117,103,103,121,32,118,101,114,115,105,111,110,32,111,102,32,103,99,99,32,117,115,105,110,103,32,97,100,118,97,110,99,101,100,32,111,112,116,105,109,105,122,97,116,105,111,110,115,0,0,0,0,0,0,100,117,97,108,32,99,104,97,110,110,101,108,0,0,0,0,86,111,99,97,108,0,0,0,115,116,101,114,101,111,0,0,84,114,105,112,45,72,111,112,0,0,0,0,0,0,0,0,106,111,105,110,116,32,115,116,101,114,101,111,0,0,0,0,65,109,98,105,101,110,116,0,9,77,80,69,71,45,37,115,32,76,97,121,101,114,32,51,10,0,0,0,0,0,0,0,69,117,114,111,45,84,101,99,104,110,111,0,0,0,0,0,63,0,0,0,0,0,0,0,83,111,117,110,100,116,114,97,99,107,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,49,46,48,0,0,0,0,0,50,0,0,0,0,0,0,0,80,114,97,110,107,115,0,0,49,0,0,0,0,0,0,0,68,101,97,116,104,32,77,101,116,97,108,0,0,0,0,0,50,46,53,0,0,0,0,0,83,107,97,0,0,0,0,0,10,115,116,114,101,97,109,32])
.concat([102,111,114,109,97,116,58,10,10,0,0,0,0,0,0,0,65,108,116,101,114,110,97,116,105,118,101,0,0,0,0,0,9,46,46,46,10,0,0,0,73,110,100,117,115,116,114,105,97,108,0,0,0,0,0,0,84,104,105,115,32,105,115,32,97,32,102,97,116,97,108,32,101,114,114,111,114,46,32,32,73,116,32,104,97,115,32,115,101,118,101,114,97,108,32,112,111,115,115,105,98,108,101,32,99,97,117,115,101,115,58,0,9,101,120,112,101,114,105,109,101,110,116,97,108,32,89,61,37,100,10,0,0,0,0,0,84,101,99,104,110,111,0,0,9,104,117,102,102,109,97,110,32,115,101,97,114,99,104,58,32,37,115,10,0,0,0,0,82,111,99,107,0,0,0,0,98,101,115,116,32,40,105,110,115,105,100,101,32,108,111,111,112,44,32,115,108,111,119,41,0,0,0,0,0,0,0,0,82,101,103,103,97,101,0,0,73,78,84,69,82,78,65,76,32,69,82,82,79,82,32,73,78,32,86,66,82,32,78,69,87,32,67,79,68,69,44,32,112,108,101,97,115,101,32,115,101,110,100,32,98,117,103,32,114,101,112,111,114,116,10,0,98,101,115,116,32,40,111,117,116,115,105,100,101,32,108,111,111,112,41,0,0,0,0,0,82,97,112,0,0,0,0,0,110,111,114,109,97,108,0,0,82,38,66,0,0,0,0,0,105,110,32,117,115,101,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,76,65,77,69,51,46,57,57,114,0,0,0,0,0,0,0,80,111,112,0,0,0,0,0,9,99,104,49,32,40,114,105,103,104,116,41,32,115,99,97,108,105,110,103,58,32,37,103,10,0,0,0,0,0,0,0,98,105,116,32,114,101,115,101,114,118,111,105,114,32,101,114,114,111,114,58,32,10,108,51,95,115,105,100,101,45,62,109,97,105,110,95,100,97,116,97,95,98,101,103,105,110,58,32,37,105,32,10,82,101,115,118,111,105,114,32,115,105,122,101,58,32,32,32,32,32,32,32,32,32,32,32,32,32,37,105,32,10,114,101,115,118,32,100,114,97,105,110,32,40,112,111,115,116,41,32,32,32,32,32,32,32,32,32,37,105,32,10,114,101,115,118,32,100,114,97,105,110,32,40,112,114,101,41,32,32,32,32,32,32,32,32,32,32,37,105,32,10,104,101,97,100,101,114,32,97,110,100,32,115,105,100,101,105,110,102,111,58,32,32,32,32,32,32,37,105,32,10,100,97,116,97,32,98,105,116,115,58,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,37,105,32,10,116,111,116,97,108,32,98,105,116,115,58,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,37,105,32,40,114,101,109,97,105,110,100,101,114,58,32,37,105,41,32,10,98,105,116,115,112,101,114,102,114,97,109,101,58,32,32,32,32,32,32,32,32,32,32,32,32,32,37,105,32,10,0,0,37,115,58,32,0,0,0,0,9,99,104,48,32,40,108,101,102,116,41,32,115,99,97,108,105,110,103,58,32,37,103,10,0,0,0,0,0,0,0,0,79,116,104,101,114,0,0,0,9,115,99,97,108,105,110,103,58,32,37,103,10,0,0,0,37,115,10,0,0,0,0,0,79,108,100,105,101,115,0,0,88,88,88,0,0,0,0,0,10,109,105,115,99,58,10,10,0,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,78,101,119,32,65,103,101,0,77,101,116,97,108,0,0,0,115,116,114,97,110,103,101,32,101,114,114,111,114,32,102,108,117,115,104,105,110,103,32,98,117,102,102,101,114,32,46,46,46,32,10,0,0,0,0,0,87,97,114,110,105,110,103,58,32,109,97,110,121,32,100,101,99,111,100,101,114,115,32,99,97,110,110,111,116,32,104,97,110,100,108,101,32,102,114,101,101,32,102,111,114,109,97,116,32,98,105,116,114,97,116,101,115,32,62,51,50,48,32,107,98,112,115,32,40,115,101,101,32,100,111,99,117,109,101,110,116,97,116,105,111,110,41,10,0,0,0,0,0,0,0,0,74,97,122,122,0,0,0,0,37,115,58,32,0,0,0,0,87,97,114,110,105,110,103,58,32,109,97,110,121,32,100,101,99,111,100,101,114,115,32,99,97,110,110,111,116,32,104,97,110,100,108,101,32,102,114,101,101,32,102,111,114,109,97,116,32,98,105,116,115,116,114,101,97,109,115,10,0,0,0,0,72,105,112,45,72,111,112,0,112,111,108,121,112,104,97,115,101,32,108,111,119,112,97,115,115,32,102,105,108,116,101,114,32,100,105,115,97,98,108,101,100,10,0,0,0,0,0,0,71,114,117,110,103,101,0,0,85,115,105,110,103,32,112,111,108,121,112,104,97,115,101,32,108,111,119,112,97,115,115,32,102,105,108,116,101,114,44,32,116,114,97,110,115,105,116,105,111,110,32,98,97,110,100,58,32,37,53,46,48,102,32,72,122,32,45,32,37,53,46,48,102,32,72,122,10,0,0,0,70,117,110,107,0,0,0,0,76,65,77,69,32,37,115,32,37,115,32,40,37,115,41,10,0,0,0,0,0,0,0,0,83,121,110,116,104,80,111,112,0,0,0,0,0,0,0,0,74,80,111,112,0,0,0,0,65,110,105,109,101,0,0,0,84,104,114,97,115,104,32,77,101,116,97,108,0,0,0,0,37,115,58,32,0,0,0,0,83,97,108,115,97,0,0,0,77,101,114,101,110,103,117,101,0,0,0,0,0,0,0,0,67,104,114,105,115,116,105,97,110,32,82,111,99,107,0,0,85,115,105,110,103,32,112,111,108,121,112,104,97,115,101,32,104,105,103,104,112,97,115,115,32,102,105,108,116,101,114,44,32,116,114,97,110,115,105,116,105,111,110,32,98,97,110,100,58,32,37,53,46,48,102,32,72,122,32,45,32,37,53,46,48,102,32,72,122,10,0,0,67,111,110,116,101,109,112,111,114,97,114,121,32,67,104,114,105,115,116,105,97,110,0,0,67,114,111,115,115,111,118,101,114,0,0,0,0,0,0,0,68,105,115,99,111,0,0,0,66,108,97,99,107,32,77,101,116,97,108,0,0,0,0,0,72,101,97,118,121,32,77,101,116,97,108,0,0,0,0,0,67,104,114,105,115,116,105,97,110,32,71,97,110,103,115,116,97,0,0,0,0,0,0,0,66,101,97,116,0,0,0,0,115,121,115,116,101,109,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,80,111,108,115,107,32,80,117,110,107,0,0,0,0,0,0,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0,0,0,0,76,65,77,69,51,46,57,57,114,53,0,0,0,0,0,0,78,101,103,101,114,112,117,110,107,0,0,0,0,0,0,0,73,78,84,69,82,78,65,76,32,69,82,82,79,82,32,73,78,32,86,66,82,32,78,69,87,32,67,79,68,69,32,40,57,56,54,41,44,32,112,108,101,97,115,101,32,115,101,110,100,32,98,117,103,32,114,101,112,111,114,116,10,0,0,0,66,114,105,116,80,111,112,0,73,110,100,105,101,0,0,0,82,101,115,97,109,112,108,105,110,103,58,32,32,105,110,112,117,116,32,37,103,32,107,72,122,32,32,111,117,116,112,117,116,32,37,103,32,107,72,122,10,0,0,0,0,0,0,0,84,101,114,114,111,114,0,0,72,97,114,100,99,111,114,101,0,0,0,0,0,0,0,0,68,97,110,99,101,0,0,0,67,108,117,98,45,72,111,117,115,101,0,0,0,0,0,0,68,114,117,109,32,38,32,66,97,115,115,0,0,0,0,0,71,111,97,0,0,0,0,0,68,97,110,99,101,32,72,97,108,108,0,0,0,0,0,0,69,117,114,111,45,72,111,117,115,101,0,0,0,0,0,0,65,32,67,97,112,112,101,108,108,97,0,0,0,0,0,0,68,114,117,109,32,83,111,108,111,0,0,0,0,0,0,0,67,111,117,110,116,114,121,0,80,117,110,107,32,82,111,99,107,0,0,0,0,0,0,0,65,117,116,111,99,111,110,118,101,114,116,105,110,103,32,102,114,111,109,32,115,116,101,114,101,111,32,116,111,32,109,111,110,111,46,32,83,101,116,116,105,110,103,32,101,110,99,111,100,105,110,103,32,116,111,32,109,111,110,111,32,109,111,100,101,46,10,0,0,0,0,0,68,117,101,116,0,0,0,0,70,114,101,101,115,116,121,108,101,0,0,0,0,0,0,0,73,110,116,101,114,110,97,108,32,98,117,102,102,101,114,32,105,110,99,111,110,115,105,115,116,101,110,99,121,46,32,102,108,117,115,104,98,105,116,115,32,60,62,32,82,101,115,118,83,105,122,101,0,0,0,0,82,104,121,116,104,109,105,99,32,83,111,117,108,0,0,0,80,111,119,101,114,32,66,97,108,108,97,100,0,0,0,0,66,97,108,108,97,100,0,0,70,111,108,107,108,111,114,101,0,0,0,0,0,0,0,0,83,97,109,98,97,0,0,0,84,97,110,103,111,0,0,0,67,108,117,98,0,0,0,0,83,108,111,119,32,74,97,109,0,0,0,0,0,0,0,0,67,80,85,32,102,101,97,116,117,114,101,115,58,32,37,115,10,0,0,0,0,0,0,0,83,97,116,105,114,101,0,0,80,111,114,110,32,71,114,111,111,118,101,0,0,0,0,0,67,108,97,115,115,105,99,32,82,111,99,107,0,0,0,0,58,32,0,0,0,0,0,0,80,114,105,109,117,115,0,0,66,111,111,116,121,32,66,97,115,115,0,0,0,0,0,0,83,121,109,112,104,111,110,121,0,0,0,0,0,0,0,0,83,111,110,97,116,97,0,0,67,104,97,109,98,101,114,32,77,117,115,105,99,0,0,0,79,112,101,114,97,0,0,0,67,104,97,110,115,111,110,0,83,112,101,101,99,104,0,0,71,73,70,56,0,0,0,0,66,108,117,101,115,0,0,0,83,83,69,50,0,0,0,0,72,117,109,111,117,114,0,0,58,32,0,0,0,0,0,0,65,99,111,117,115,116,105,99,0,0,0,0,0,0,0,0,80,78,71,0,0,0,0,0,69,97,115,121,32,76,105,115,116,101,110,105,110,103,0,0,67,104,111,114,117,115,0,0,66,105,103,32,66,97,110,100,0,0,0,0,0,0,0,0,83,108,111,119,32,82,111,99,107,0,0,0,0,0,0,0,83,121,109,112,104,111,110,105,99,32,82,111,99,107,0,0,80,115,121,99,104,101,100,101,108,105,99,32,82,111,99,107,0,0,0,0,0,0,0,0,80,114,111,103,114,101,115,115,105,118,101,32,82,111,99,107,0,0,0,0,0,0,0,0,71,111,116,104,105,99,32,82,111,99,107,0,0,0,0,0,65,118,97,110,116,103,97,114,100,101,0,0,0,0,0,0,66,108,117,101,103,114,97,115,115,0,0,0,0,0,0,0,76,65,77,69,32,118,101,114,115,105,111,110,32,37,115,32,40,37,115,41,0,0,0,0,73,68,51,0,0,0,0,0,69,114,114,111,114,58,32,99,97,110,39,116,32,97,108,108,111,99,97,116,101,32,86,98,114,70,114,97,109,101,115,32,98,117,102,102,101,114,10,0,0,0,0,0,160,90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,50,48,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,90,0,0,0,0,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,1,5,3,2,4,0,3,0,221,1,30,61,115,47,118,192,47,250,176,188,158,20,250,64,153,188,161,186,158,119,53,193,81,220,194,184,116,225,80,65,83,153,135,188,1,154,68,193,129,18,177,60,29,186,23,65,225,231,169,188,42,236,187,192,86,189,194,59,84,76,48,64,23,210,72,59,21,174,94,191,117,48,252,56,166,136,14,62,45,12,61,59,187,242,93,61,21,159,94,192,66,120,238,188,39,159,203,64,116,13,11,188,159,194,8,193,122,116,11,188,136,161,23,65,15,206,8,188,48,10,13,193,54,239,183,60,24,84,219,64,42,177,212,188,119,161,140,192,227,27,133,60,46,141,12,64,204,220,29,187,91,68,64,191,179,14,221,59,38,166,6,62,18,27,246,186,98,72,30,62,88,65,24,192,146,25,191,189,204,80,54,64,198,233,127,189,83,84,41,192,195,60,177,60,160,42,15,64,141,230,100,189,27,243,213,191,107,217,67,61,72,195,128,63,221,177,17,59,30,72,235,190,198,2,2,61,96,182,39,62,140,213,99,188,41,29,78,189,32,117,213,59,250,86,192,60,8,103,16,188,195,30,155,62,254,109,206,191,55,145,103,190,17,54,138,63,79,222,175,189,44,92,131,190,5,120,6,61,113,172,38,190,93,7,22,188,128,210,103,190,162,171,193,188,106,76,200,62,186,131,191,187,206,177,98,190,217,136,128,61,99,84,56,61,14,238,10,183,195,81,164,60,229,233,6,59,220,52,70,59,209,172,241,188,164,63,172,62,202,209,191,191,12,238,130,190,224,157,95,63,198,63,242,189,120,245,249,61,39,37,244,61,171,200,78,191,74,115,160,189,61,4,245,62,155,0,154,187,253,11,255,189,221,42,193,187,240,154,38,189,226,118,106,61,225,172,170,61,116,82,8,60,208,143,45,189,111,248,133,188,144,228,243,60,148,49,144,188,83,247,229,62,31,210,32,191,69,246,18,190,75,222,151,62,236,79,105,190,172,192,190,190,13,131,104,188,76,24,12,59,175,11,39,61,83,49,215,190,21,234,253,189,13,83,99,62,22,214,39,61,196,1,201,59,137,153,214,61,247,48,138,61,143,176,152,188,61,242,108,61,134,205,2,189,7,1,4,61,132,146,177,59,35,242,16,63,249,36,134,191,99,48,65,191,195,71,149,62,202,81,38,62,41,63,137,190,8,118,43,62,71,89,6,60,108,141,65,190,36,174,230,62,232,94,158,62,59,32,169,190,83,31,141,190,179,5,138,61,91,28,212,59,139,246,67,189,211,25,177,61,92,87,134,60,98,50,27,189,45,15,148,60,22,191,192,187,190,188,20,63,131,166,2,191,181,32,8,191,54,36,163,190,218,83,18,190,249,108,79,190,122,105,51,62,249,208,22,62,32,205,194,60,1,112,199,62,138,81,31,62,88,186,110,190,236,195,129,190,127,224,86,189,85,103,133,60,212,73,205,188,47,187,141,61,242,19,200,60,237,111,24,189,6,255,148,60,149,162,245,187,69,87,9,63,94,65,128,190,239,223,215,190,42,39,221,190,85,217,52,187,98,70,12,189,146,207,46,61,213,159,63,189,79,51,209,189,227,53,135,62,214,104,21,62,42,194,26,62,27,131,201,188,75,199,51,190,101,108,229,189,100,191,64,190,139,76,38,189,16,94,96,61,204,36,68,61,80,177,64,61,130,177,181,188,0,0,0,0,98,120,124,63,40,114,252,191,98,120,252,191,59,253,120,63,98,120,124,63,19,41,124,63,180,33,252,191,19,41,252,191,229,96,120,63,19,41,124,63,66,185,122,63,86,171,250,191,66,185,250,191,92,142,117,63,66,185,122,63,120,174,121,63,129,154,249,191,120,174,249,191,222,132,115,63,120,174,121,63,91,33,121,63,194,9,249,191,91,33,249,191,234,113,114,63,91,33,121,63,110,236,118,63,58,195,246,191,110,236,246,191,69,43,110,63,110,236,118,63,141,200,117,63,87,148,245,191,141,200,245,191,134,249,107,63,141,200,117,63,202,100,117,63,133,44,245,191,202,100,245,191,31,58,107,63,202,100,117,63,138,43,114,63,214,203,241,191,138,43,242,191,124,22,101,63,138,43,114,63,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
HEAP32[((9800 )>>2)]=((146720)|0);
HEAP32[((12480 )>>2)]=((3696)|0);
HEAP32[((12484 )>>2)]=((3688)|0);
HEAP32[((12496 )>>2)]=((2896)|0);
HEAP32[((12500 )>>2)]=((2880)|0);
HEAP32[((12512 )>>2)]=((2760)|0);
HEAP32[((12516 )>>2)]=((2744)|0);
HEAP32[((12544 )>>2)]=((2712)|0);
HEAP32[((12548 )>>2)]=((2696)|0);
HEAP32[((12560 )>>2)]=((2664)|0);
HEAP32[((12564 )>>2)]=((2648)|0);
HEAP32[((12576 )>>2)]=((2576)|0);
HEAP32[((12580 )>>2)]=((2536)|0);
HEAP32[((12592 )>>2)]=((2464)|0);
HEAP32[((12596 )>>2)]=((2424)|0);
HEAP32[((12608 )>>2)]=((2352)|0);
HEAP32[((12612 )>>2)]=((2312)|0);
HEAP32[((12624 )>>2)]=((6712)|0);
HEAP32[((12628 )>>2)]=((6648)|0);
HEAP32[((12640 )>>2)]=((6520)|0);
HEAP32[((12644 )>>2)]=((6456)|0);
HEAP32[((12656 )>>2)]=((6328)|0);
HEAP32[((12660 )>>2)]=((6264)|0);
HEAP32[((12672 )>>2)]=((5752)|0);
HEAP32[((12676 )>>2)]=((5496)|0);
HEAP32[((12692 )>>2)]=((3960)|0);
HEAP32[((12704 )>>2)]=((4984)|0);
HEAP32[((12708 )>>2)]=((4728)|0);
HEAP32[((12720 )>>2)]=((4216)|0);
HEAP32[((12724 )>>2)]=((3704)|0);
HEAP32[((12736 )>>2)]=((4216)|0);
HEAP32[((12740 )>>2)]=((3704)|0);
HEAP32[((12752 )>>2)]=((4216)|0);
HEAP32[((12756 )>>2)]=((3704)|0);
HEAP32[((12768 )>>2)]=((4216)|0);
HEAP32[((12772 )>>2)]=((3704)|0);
HEAP32[((12784 )>>2)]=((4216)|0);
HEAP32[((12788 )>>2)]=((3704)|0);
HEAP32[((12800 )>>2)]=((4216)|0);
HEAP32[((12804 )>>2)]=((3704)|0);
HEAP32[((12816 )>>2)]=((4216)|0);
HEAP32[((12820 )>>2)]=((3704)|0);
HEAP32[((12832 )>>2)]=((4216)|0);
HEAP32[((12836 )>>2)]=((3704)|0);
HEAP32[((12848 )>>2)]=((3176)|0);
HEAP32[((12852 )>>2)]=((2920)|0);
HEAP32[((12864 )>>2)]=((3176)|0);
HEAP32[((12868 )>>2)]=((2920)|0);
HEAP32[((12880 )>>2)]=((3176)|0);
HEAP32[((12884 )>>2)]=((2920)|0);
HEAP32[((12896 )>>2)]=((3176)|0);
HEAP32[((12900 )>>2)]=((2920)|0);
HEAP32[((12912 )>>2)]=((3176)|0);
HEAP32[((12916 )>>2)]=((2920)|0);
HEAP32[((12928 )>>2)]=((3176)|0);
HEAP32[((12932 )>>2)]=((2920)|0);
HEAP32[((12944 )>>2)]=((3176)|0);
HEAP32[((12948 )>>2)]=((2920)|0);
HEAP32[((12960 )>>2)]=((3176)|0);
HEAP32[((12964 )>>2)]=((2920)|0);
HEAP32[((12976 )>>2)]=((2848)|0);
HEAP32[((12980 )>>2)]=((2832)|0);
HEAP32[((12992 )>>2)]=((2800)|0);
HEAP32[((12996 )>>2)]=((2784)|0);
HEAP32[((13008 )>>2)]=((22768)|0);
HEAP32[((13012 )>>2)]=((22648)|0);
HEAP32[((13016 )>>2)]=((22328)|0);
HEAP32[((13020 )>>2)]=((22216)|0);
HEAP32[((13024 )>>2)]=((21888)|0);
HEAP32[((13028 )>>2)]=((21648)|0);
HEAP32[((13032 )>>2)]=((21568)|0);
HEAP32[((13036 )>>2)]=((21520)|0);
HEAP32[((13040 )>>2)]=((21440)|0);
HEAP32[((13044 )>>2)]=((21296)|0);
HEAP32[((13048 )>>2)]=((21288)|0);
HEAP32[((13052 )>>2)]=((21248)|0);
HEAP32[((13056 )>>2)]=((21216)|0);
HEAP32[((13060 )>>2)]=((20856)|0);
HEAP32[((13064 )>>2)]=((20800)|0);
HEAP32[((13068 )>>2)]=((20784)|0);
HEAP32[((13072 )>>2)]=((20696)|0);
HEAP32[((13076 )>>2)]=((20656)|0);
HEAP32[((13080 )>>2)]=((20624)|0);
HEAP32[((13084 )>>2)]=((20528)|0);
HEAP32[((13088 )>>2)]=((20504)|0);
HEAP32[((13092 )>>2)]=((20472)|0);
HEAP32[((13096 )>>2)]=((20448)|0);
HEAP32[((13100 )>>2)]=((20432)|0);
HEAP32[((13104 )>>2)]=((20384)|0);
HEAP32[((13108 )>>2)]=((20360)|0);
HEAP32[((13112 )>>2)]=((20328)|0);
HEAP32[((13116 )>>2)]=((20296)|0);
HEAP32[((13120 )>>2)]=((20280)|0);
HEAP32[((13124 )>>2)]=((20168)|0);
HEAP32[((13128 )>>2)]=((20152)|0);
HEAP32[((13132 )>>2)]=((20104)|0);
HEAP32[((13136 )>>2)]=((20072)|0);
HEAP32[((13140 )>>2)]=((19944)|0);
HEAP32[((13144 )>>2)]=((19896)|0);
HEAP32[((13148 )>>2)]=((19848)|0);
HEAP32[((13152 )>>2)]=((19824)|0);
HEAP32[((13156 )>>2)]=((19792)|0);
HEAP32[((13160 )>>2)]=((19768)|0);
HEAP32[((13164 )>>2)]=((19688)|0);
HEAP32[((13168 )>>2)]=((19632)|0);
HEAP32[((13172 )>>2)]=((19576)|0);
HEAP32[((13176 )>>2)]=((19536)|0);
HEAP32[((13180 )>>2)]=((19488)|0);
HEAP32[((13184 )>>2)]=((19432)|0);
HEAP32[((13188 )>>2)]=((19392)|0);
HEAP32[((13192 )>>2)]=((19344)|0);
HEAP32[((13196 )>>2)]=((19312)|0);
HEAP32[((13200 )>>2)]=((19288)|0);
HEAP32[((13204 )>>2)]=((19224)|0);
HEAP32[((13208 )>>2)]=((19200)|0);
HEAP32[((13212 )>>2)]=((19128)|0);
HEAP32[((13216 )>>2)]=((19088)|0);
HEAP32[((13220 )>>2)]=((19048)|0);
HEAP32[((13224 )>>2)]=((18992)|0);
HEAP32[((13228 )>>2)]=((18952)|0);
HEAP32[((13232 )>>2)]=((18896)|0);
HEAP32[((13236 )>>2)]=((18864)|0);
HEAP32[((13240 )>>2)]=((18832)|0);
HEAP32[((13244 )>>2)]=((18744)|0);
HEAP32[((13248 )>>2)]=((18728)|0);
HEAP32[((13252 )>>2)]=((18656)|0);
HEAP32[((13256 )>>2)]=((18616)|0);
HEAP32[((13260 )>>2)]=((18592)|0);
HEAP32[((13264 )>>2)]=((18560)|0);
HEAP32[((13268 )>>2)]=((18536)|0);
HEAP32[((13272 )>>2)]=((18496)|0);
HEAP32[((13276 )>>2)]=((18456)|0);
HEAP32[((13280 )>>2)]=((18416)|0);
HEAP32[((13284 )>>2)]=((18368)|0);
HEAP32[((13288 )>>2)]=((18320)|0);
HEAP32[((13292 )>>2)]=((18264)|0);
HEAP32[((13296 )>>2)]=((18184)|0);
HEAP32[((13300 )>>2)]=((18160)|0);
HEAP32[((13304 )>>2)]=((18136)|0);
HEAP32[((13308 )>>2)]=((18088)|0);
HEAP32[((13312 )>>2)]=((18040)|0);
HEAP32[((13316 )>>2)]=((18024)|0);
HEAP32[((13320 )>>2)]=((17968)|0);
HEAP32[((13324 )>>2)]=((17872)|0);
HEAP32[((13328 )>>2)]=((17808)|0);
HEAP32[((13332 )>>2)]=((17752)|0);
HEAP32[((13336 )>>2)]=((17664)|0);
HEAP32[((13340 )>>2)]=((17656)|0);
HEAP32[((13344 )>>2)]=((17632)|0);
HEAP32[((13348 )>>2)]=((17624)|0);
HEAP32[((13352 )>>2)]=((17616)|0);
HEAP32[((13356 )>>2)]=((17608)|0);
HEAP32[((13360 )>>2)]=((17600)|0);
HEAP32[((13364 )>>2)]=((22976)|0);
HEAP32[((13368 )>>2)]=((22960)|0);
HEAP32[((13372 )>>2)]=((22944)|0);
HEAP32[((13376 )>>2)]=((22920)|0);
HEAP32[((13380 )>>2)]=((22896)|0);
HEAP32[((13384 )>>2)]=((22880)|0);
HEAP32[((13388 )>>2)]=((22864)|0);
HEAP32[((13392 )>>2)]=((22848)|0);
HEAP32[((13396 )>>2)]=((22840)|0);
HEAP32[((13400 )>>2)]=((22824)|0);
HEAP32[((13404 )>>2)]=((22800)|0);
HEAP32[((13408 )>>2)]=((22784)|0);
HEAP32[((13412 )>>2)]=((22752)|0);
HEAP32[((13416 )>>2)]=((22744)|0);
HEAP32[((13420 )>>2)]=((22736)|0);
HEAP32[((13424 )>>2)]=((22720)|0);
HEAP32[((13428 )>>2)]=((22712)|0);
HEAP32[((13432 )>>2)]=((22696)|0);
HEAP32[((13436 )>>2)]=((22680)|0);
HEAP32[((13440 )>>2)]=((22672)|0);
HEAP32[((13444 )>>2)]=((22632)|0);
HEAP32[((13448 )>>2)]=((22624)|0);
HEAP32[((13452 )>>2)]=((22584)|0);
HEAP32[((13456 )>>2)]=((22576)|0);
HEAP32[((13460 )>>2)]=((22568)|0);
HEAP32[((13464 )>>2)]=((22560)|0);
HEAP32[((13468 )>>2)]=((22544)|0);
HEAP32[((13472 )>>2)]=((22536)|0);
HEAP32[((13476 )>>2)]=((22520)|0);
HEAP32[((13480 )>>2)]=((22504)|0);
HEAP32[((13484 )>>2)]=((22432)|0);
HEAP32[((13488 )>>2)]=((22424)|0);
HEAP32[((13492 )>>2)]=((22336)|0);
HEAP32[((13496 )>>2)]=((22312)|0);
HEAP32[((13500 )>>2)]=((22296)|0);
HEAP32[((13504 )>>2)]=((22280)|0);
HEAP32[((13508 )>>2)]=((22264)|0);
HEAP32[((13512 )>>2)]=((22256)|0);
HEAP32[((13516 )>>2)]=((22240)|0);
HEAP32[((13520 )>>2)]=((22224)|0);
HEAP32[((13524 )>>2)]=((22200)|0);
HEAP32[((13528 )>>2)]=((22192)|0);
HEAP32[((13532 )>>2)]=((22136)|0);
HEAP32[((13536 )>>2)]=((22128)|0);
HEAP32[((13540 )>>2)]=((22048)|0);
HEAP32[((13544 )>>2)]=((21992)|0);
HEAP32[((13548 )>>2)]=((21952)|0);
HEAP32[((13552 )>>2)]=((21928)|0);
HEAP32[((13556 )>>2)]=((21912)|0);
HEAP32[((13560 )>>2)]=((21896)|0);
HEAP32[((13564 )>>2)]=((21872)|0);
HEAP32[((13568 )>>2)]=((21848)|0);
HEAP32[((13572 )>>2)]=((21760)|0);
HEAP32[((13576 )>>2)]=((21744)|0);
HEAP32[((13580 )>>2)]=((21736)|0);
HEAP32[((13584 )>>2)]=((21712)|0);
HEAP32[((13588 )>>2)]=((21704)|0);
HEAP32[((13592 )>>2)]=((21696)|0);
HEAP32[((13596 )>>2)]=((21680)|0);
HEAP32[((23072 )>>2)]=(38);
HEAP32[((23076 )>>2)]=(16);
HEAP32[((23080 )>>2)]=(30);
HEAP32[((23104 )>>2)]=(38);
HEAP32[((23108 )>>2)]=(2);
HEAP32[((23112 )>>2)]=(58);
HEAP32[((23192 )>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((23196 )>>2)]=((23128)|0);
HEAP32[((23200 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((23204 )>>2)]=((23144)|0);
HEAP32[((23216 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((23220 )>>2)]=((23160)|0);
}
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var VFS=undefined;
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path, ext) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var f = PATH.splitPath(path)[2];
        if (ext && f.substr(-1 * ext.length) === ext) {
          f = f.substr(0, f.length - ext.length);
        }
        return f;
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.filter(function(p, index) {
          if (typeof p !== 'string') {
            throw new TypeError('Arguments to path.join must be strings');
          }
          return p;
        }).join('/'));
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },mount:function (mount) {
        return MEMFS.create_node(null, '/', 16384 | 0o777, 0);
      },create_node:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek
          };
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap
          };
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          };
          node.stream_ops = {};
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = FS.chrdev_stream_ops;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.create_node(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.create_node(parent, newname, 0o777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            assert(buffer.length);
            if (canOwn && buffer.buffer === HEAP8.buffer && offset === 0) {
              node.contents = buffer; // this is a subarray of the heap, and we can own it
              node.contentMode = MEMFS.CONTENT_OWNING;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        },handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + new Error().stack;
        return ___setErrNo(e.errno);
      },cwd:function () {
        return FS.currentPath;
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.currentPath, path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            return path ? PATH.join(node.mount.mountpoint, path) : node.mount.mountpoint;
          }
          path = path ? PATH.join(node.name, path) : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          if (node.parent.id === parent.id && node.name === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        var node = {
          id: FS.nextInode++,
          name: name,
          mode: mode,
          node_ops: {},
          stream_ops: {},
          rdev: rdev,
          parent: null,
          mount: null
        };
        if (!parent) {
          parent = node;  // root node sets parent to itself
        }
        node.parent = parent;
        node.mount = parent.mount;
        // compatibility
        var readMode = 292 | 73;
        var writeMode = 146;
        // NOTE we must use Object.defineProperties instead of individual calls to
        // Object.defineProperty in order to make closure compiler happy
        Object.defineProperties(node, {
          read: {
            get: function() { return (node.mode & readMode) === readMode; },
            set: function(val) { val ? node.mode |= readMode : node.mode &= ~readMode; }
          },
          write: {
            get: function() { return (node.mode & writeMode) === writeMode; },
            set: function(val) { val ? node.mode |= writeMode : node.mode &= ~writeMode; }
          },
          isFolder: {
            get: function() { return FS.isDir(node.mode); },
          },
          isDevice: {
            get: function() { return FS.isChrdev(node.mode); },
          },
        });
        FS.hashAddNode(node);
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.currentPath) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        // compatibility
        Object.defineProperties(stream, {
          object: {
            get: function() { return stream.node; },
            set: function(val) { stream.node = val; }
          },
          isRead: {
            get: function() { return (stream.flags & 2097155) !== 1; }
          },
          isWrite: {
            get: function() { return (stream.flags & 2097155) !== 0; }
          },
          isAppend: {
            get: function() { return (stream.flags & 1024); }
          }
        });
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },mount:function (type, opts, mountpoint) {
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
        }
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0o666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0o777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0o666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        path = PATH.normalize(path);
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0o666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        try {
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072)
          });
          node = lookup.node;
          path = lookup.path;
        } catch (e) {
          // ignore
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // register the stream with the filesystem
        var stream = FS.createStream({
          path: path,
          node: node,
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },staticInit:function () {
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0o777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(path, mode | 146);
          var stream = FS.open(path, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(path, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStream(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0o777, 0);
      },nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {} : ['binary'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          var handleMessage = function(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = {}; //require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }
  function _strncpy(pdest, psrc, num) {
      pdest = pdest|0; psrc = psrc|0; num = num|0;
      var padding = 0, curr = 0, i = 0;
      while ((i|0) < (num|0)) {
        curr = padding ? 0 : HEAP8[(((psrc)+(i))|0)];
        HEAP8[(((pdest)+(i))|0)]=curr
        padding = padding ? 1 : (HEAP8[(((psrc)+(i))|0)] == 0);
        i = (i+1)|0;
      }
      return pdest|0;
    }
  var _floorf=Math.floor;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  var _cos=Math.cos;
  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }
  function _memmove(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      if (((src|0) < (dest|0)) & ((dest|0) < ((src + num)|0))) {
        // Unlikely case: Copy backwards in a safe manner
        src = (src + num)|0;
        dest = (dest + num)|0;
        while ((num|0) > 0) {
          dest = (dest - 1)|0;
          src = (src - 1)|0;
          num = (num - 1)|0;
          HEAP8[(dest)]=HEAP8[(src)];
        }
      } else {
        _memcpy(dest, src, num) | 0;
      }
    }var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var _ceil=Math.ceil;
  var _llvm_memset_p0i8_i64=_memset;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
      // Apply sign.
      ret *= multiplier;
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
      if (bits == 64) {
        return tempRet0 = (tempDouble=ret,Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math.min(Math.floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0),ret>>>0;
      }
      return ret;
    }function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }function _atoi(ptr) {
      return _strtol(ptr, null, 10);
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }
  function _tolower(chr) {
      chr = chr|0;
      if ((chr|0) < 65) return chr|0;
      if ((chr|0) > 90) return chr|0;
      return (chr - 65 + 97)|0;
    }
  function _llvm_bswap_i16(x) {
      return ((x&0xff)<<8) | ((x>>8)&0xff);
    }
  var _llvm_pow_f64=Math.pow;
  var _llvm_pow_f32=Math.pow;
  var _floor=Math.floor;
  var _fabsf=Math.abs;
  var _ExitMP3=undefined;
  var _InitMP3=undefined;
  var _decodeMP3=undefined;
  var _decodeMP3_unclipped=undefined;
  var _log=Math.log;
  var _exp=Math.exp;
  var _sqrt=Math.sqrt;
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module.print('exit(' + status + ') called');
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
  var _fabs=Math.abs;
  function _qsort(base, num, size, cmp) {
      if (num == 0 || size == 0) return;
      // forward calls to the JavaScript sort method
      // first, sort the items logically
      var keys = [];
      for (var i = 0; i < num; i++) keys.push(i);
      keys.sort(function(a, b) {
        return FUNCTION_TABLE[cmp](base+a*size, base+b*size);
      });
      // apply the sort
      var temp = _malloc(num*size);
      _memcpy(temp, base, num*size);
      for (var i = 0; i < num; i++) {
        if (keys[i] == i) continue; // already in place
        _memcpy(base+i*size, temp+keys[i]*size, size);
      }
      _free(temp);
    }
  function _exp2(x) {
      return Math.pow(2, x);
    }
  var _atan=Math.atan;
  function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _vfprintf(s, f, va_arg) {
      return _fprintf(s, f, HEAP32[((va_arg)>>2)]);
    }
  var _llvm_va_start=undefined;
  function _llvm_va_end() {}
  var _sin=Math.sin;
  var _log10f=_log10;
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___gxx_personality_v0() {
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return tempRet0 = typeArray[i],thrown;
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return tempRet0 = throwntype,thrown;
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      __THREW__ = 0;
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        for (var j = 0; j < line.length; j++) {
          HEAP8[(((poolPtr)+(j))|0)]=line.charCodeAt(j);
        }
        HEAP8[(((poolPtr)+(j))|0)]=0;
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          for (var i = 0; i < msg.length; i++) {
            HEAP8[(((strerrbuf)+(i))|0)]=msg.charCodeAt(i)
          }
          HEAP8[(((strerrbuf)+(i))|0)]=0
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
___buildEnvironment(ENV);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var FUNCTION_TABLE = [0,0,__ZNSt20bad_array_new_lengthD0Ev,0,__warn,0,_ABR_iteration_loop,0,_find_scalefac_x34,0,_count_bit_noESC_from2
,0,_count_bit_noESC_from3,0,__ZNSt9bad_allocC2Ev,0,__ZNSt9bad_allocD0Ev,0,_VBR_old_iteration_loop,0,__errx
,0,_floatcompare,0,_VBR_new_iteration_loop,0,__verrx,0,_long_block_constrain,0,__ZNKSt9bad_alloc4whatEv
,0,_CBR_iteration_loop,0,_count_bit_null,0,__verr,0,__ZNSt9bad_allocD2Ev,0,_count_bit_noESC
,0,_short_block_constrain,0,__vwarn,0,_guess_scalefac_x34,0,_choose_table_nonMMX,0,__ZNSt20bad_array_new_lengthC2Ev
,0,__err,0,__vwarnx,0,_decodeMP3_unclipped,0,__ZNKSt20bad_array_new_length4whatEv,0,_decodeMP3,0,_init_xrpow_core_c,0,__warnx,0,_fht,0,_lame_report_def];
// EMSCRIPTEN_START_FUNCS
function _iteration_init($gfc){var label=0;label=1;while(1)switch(label){case 1:var $iteration_init_init=$gfc+8|0;var $0=HEAP32[$iteration_init_init>>2];var $cmp=($0|0)==0;if($cmp){label=2;break}else{label=44;break};case 2:HEAP32[$iteration_init_init>>2]=1;var $main_data_begin=$gfc+21312|0;HEAP32[$main_data_begin>>2]=0;var $cfg1_i=$gfc+16|0;var $ATH_i=$gfc+85796|0;var $1=HEAP32[$ATH_i>>2];var $samplerate_out_i=$gfc+64|0;var $2=HEAP32[$samplerate_out_i>>2];var $conv_i=$2|0;var $ATHfixpoint_i_i=$gfc+224|0;var $ATH_offset_db_i_i=$gfc+196|0;var $sfb_0179_i=0;label=4;break;case 3:var $cmp_i=($add_i|0)<22;if($cmp_i){var $sfb_0179_i=$add_i;label=4;break}else{var $sfb_1176_i=0;label=10;break};case 4:var $sfb_0179_i;var $arrayidx_i=$gfc+21360+($sfb_0179_i<<2)|0;var $3=HEAP32[$arrayidx_i>>2];var $add_i=$sfb_0179_i+1|0;var $arrayidx12_i=$gfc+21360+($add_i<<2)|0;var $4=HEAP32[$arrayidx12_i>>2];var $arrayidx13_i=$1+24+($sfb_0179_i<<2)|0;HEAPF32[$arrayidx13_i>>2]=9.999999933815813e+36;var $cmp15177_i=($3|0)<($4|0);if($cmp15177_i){var $i_0178_i=$3;label=5;break}else{label=3;break};case 5:var $i_0178_i;var $conv18_i=$i_0178_i|0;var $mul_i=$conv_i*$conv18_i;var $div_i=$mul_i/1152;var $call_i_i=_ATHformula($cfg1_i,$div_i);var $5=HEAPF32[$ATHfixpoint_i_i>>2];var $cmp_i_i=$5>0;if($cmp_i_i){label=6;break}else{label=7;break};case 6:var $sub_i_i=$call_i_i-$5;var $ath_0_i_i=$sub_i_i;label=8;break;case 7:var $sub2_i_i=$call_i_i-100;var $ath_0_i_i=$sub2_i_i;label=8;break;case 8:var $ath_0_i_i;var $6=HEAPF32[$ATH_offset_db_i_i>>2];var $add_i_i=$ath_0_i_i+$6;var $mul_i_i=$add_i_i*.10000000149011612;var $7=Math.pow(10,$mul_i_i);var $8=HEAPF32[$arrayidx13_i>>2];var $cmp20_i=$8<$7;var $_call_i=$cmp20_i?$8:$7;HEAPF32[$arrayidx13_i>>2]=$_call_i;var $inc_i=$i_0178_i+1|0;var $cmp15_i=($inc_i|0)<($4|0);if($cmp15_i){var $i_0178_i=$inc_i;label=5;break}else{label=3;break};case 9:var $cmp28_i=($add34_i|0)<6;if($cmp28_i){var $sfb_1176_i=$add34_i;label=10;break}else{var $sfb_2173_i=0;label=16;break};case 10:var $sfb_1176_i;var $arrayidx33_i=$gfc+21508+($sfb_1176_i<<2)|0;var $9=HEAP32[$arrayidx33_i>>2];var $add34_i=$sfb_1176_i+1|0;var $arrayidx37_i=$gfc+21508+($add34_i<<2)|0;var $10=HEAP32[$arrayidx37_i>>2];var $arrayidx38_i=$1+164+($sfb_1176_i<<2)|0;HEAPF32[$arrayidx38_i>>2]=9.999999933815813e+36;var $cmp40174_i=($9|0)<($10|0);if($cmp40174_i){var $i_1175_i=$9;label=11;break}else{label=9;break};case 11:var $i_1175_i;var $conv44_i=$i_1175_i|0;var $mul45_i=$conv_i*$conv44_i;var $div46_i=$mul45_i/1152;var $call_i116_i=_ATHformula($cfg1_i,$div46_i);var $11=HEAPF32[$ATHfixpoint_i_i>>2];var $cmp_i118_i=$11>0;if($cmp_i118_i){label=12;break}else{label=13;break};case 12:var $sub_i119_i=$call_i116_i-$11;var $ath_0_i123_i=$sub_i119_i;label=14;break;case 13:var $sub2_i121_i=$call_i116_i-100;var $ath_0_i123_i=$sub2_i121_i;label=14;break;case 14:var $ath_0_i123_i;var $12=HEAPF32[$ATH_offset_db_i_i>>2];var $add_i125_i=$ath_0_i123_i+$12;var $mul_i126_i=$add_i125_i*.10000000149011612;var $13=Math.pow(10,$mul_i126_i);var $14=HEAPF32[$arrayidx38_i>>2];var $cmp49_i=$14<$13;var $_call47_i=$cmp49_i?$14:$13;HEAPF32[$arrayidx38_i>>2]=$_call47_i;var $inc58_i=$i_1175_i+1|0;var $cmp40_i=($inc58_i|0)<($10|0);if($cmp40_i){var $i_1175_i=$inc58_i;label=11;break}else{label=9;break};case 15:var $arrayidx144_i=$gfc+21504|0;var $arrayidx147_i=$gfc+21500|0;var $sfb_3170_i=0;label=22;break;case 16:var $sfb_2173_i;var $arrayidx69_i=$gfc+21452+($sfb_2173_i<<2)|0;var $15=HEAP32[$arrayidx69_i>>2];var $add70_i=$sfb_2173_i+1|0;var $arrayidx73_i=$gfc+21452+($add70_i<<2)|0;var $16=HEAP32[$arrayidx73_i>>2];var $arrayidx74_i=$1+112+($sfb_2173_i<<2)|0;HEAPF32[$arrayidx74_i>>2]=9.999999933815813e+36;var $cmp76171_i=($15|0)<($16|0);if($cmp76171_i){var $i_2172_i=$15;label=17;break}else{var $21=9.999999933815813e+36;label=21;break};case 17:var $i_2172_i;var $conv80_i=$i_2172_i|0;var $mul81_i=$conv_i*$conv80_i;var $div82_i=$mul81_i/384;var $call_i128_i=_ATHformula($cfg1_i,$div82_i);var $17=HEAPF32[$ATHfixpoint_i_i>>2];var $cmp_i130_i=$17>0;if($cmp_i130_i){label=18;break}else{label=19;break};case 18:var $sub_i131_i=$call_i128_i-$17;var $ath_0_i135_i=$sub_i131_i;label=20;break;case 19:var $sub2_i133_i=$call_i128_i-100;var $ath_0_i135_i=$sub2_i133_i;label=20;break;case 20:var $ath_0_i135_i;var $18=HEAPF32[$ATH_offset_db_i_i>>2];var $add_i137_i=$ath_0_i135_i+$18;var $mul_i138_i=$add_i137_i*.10000000149011612;var $19=Math.pow(10,$mul_i138_i);var $20=HEAPF32[$arrayidx74_i>>2];var $cmp85_i=$20<$19;var $_call83_i=$cmp85_i?$20:$19;HEAPF32[$arrayidx74_i>>2]=$_call83_i;var $inc94_i=$i_2172_i+1|0;var $cmp76_i=($inc94_i|0)<($16|0);if($cmp76_i){var $i_2172_i=$inc94_i;label=17;break}else{var $21=$_call83_i;label=21;break};case 21:var $21;var $22=HEAP32[$arrayidx73_i>>2];var $23=HEAP32[$arrayidx69_i>>2];var $sub_i=$22-$23|0;var $conv103_i=$sub_i|0;var $mul105_i=$21*$conv103_i;HEAPF32[$arrayidx74_i>>2]=$mul105_i;var $cmp64_i=($add70_i|0)<13;if($cmp64_i){var $sfb_2173_i=$add70_i;label=16;break}else{label=15;break};case 22:var $sfb_3170_i;var $arrayidx115_i=$gfc+21536+($sfb_3170_i<<2)|0;var $24=HEAP32[$arrayidx115_i>>2];var $add116_i=$sfb_3170_i+1|0;var $arrayidx119_i=$gfc+21536+($add116_i<<2)|0;var $25=HEAP32[$arrayidx119_i>>2];var $arrayidx120_i=$1+188+($sfb_3170_i<<2)|0;HEAPF32[$arrayidx120_i>>2]=9.999999933815813e+36;var $cmp122168_i=($24|0)<($25|0);if($cmp122168_i){var $i_3169_i=$24;label=23;break}else{var $30=9.999999933815813e+36;label=27;break};case 23:var $i_3169_i;var $conv126_i=$i_3169_i|0;var $mul127_i=$conv_i*$conv126_i;var $div128_i=$mul127_i/384;var $call_i140_i=_ATHformula($cfg1_i,$div128_i);var $26=HEAPF32[$ATHfixpoint_i_i>>2];var $cmp_i142_i=$26>0;if($cmp_i142_i){label=24;break}else{label=25;break};case 24:var $sub_i143_i=$call_i140_i-$26;var $ath_0_i147_i=$sub_i143_i;label=26;break;case 25:var $sub2_i145_i=$call_i140_i-100;var $ath_0_i147_i=$sub2_i145_i;label=26;break;case 26:var $ath_0_i147_i;var $27=HEAPF32[$ATH_offset_db_i_i>>2];var $add_i149_i=$ath_0_i147_i+$27;var $mul_i150_i=$add_i149_i*.10000000149011612;var $28=Math.pow(10,$mul_i150_i);var $29=HEAPF32[$arrayidx120_i>>2];var $cmp131_i=$29<$28;var $_call129_i=$cmp131_i?$29:$28;HEAPF32[$arrayidx120_i>>2]=$_call129_i;var $inc140_i=$i_3169_i+1|0;var $cmp122_i=($inc140_i|0)<($25|0);if($cmp122_i){var $i_3169_i=$inc140_i;label=23;break}else{var $30=$_call129_i;label=27;break};case 27:var $30;var $31=HEAP32[$arrayidx144_i>>2];var $32=HEAP32[$arrayidx147_i>>2];var $sub148_i=$31-$32|0;var $conv149_i=$sub148_i|0;var $mul151_i=$30*$conv149_i;HEAPF32[$arrayidx120_i>>2]=$mul151_i;var $cmp110_i=($add116_i|0)<6;if($cmp110_i){var $sfb_3170_i=$add116_i;label=22;break}else{label=28;break};case 28:var $noATH_i=$gfc+220|0;var $33=HEAP32[$noATH_i>>2];var $tobool_i=($33|0)==0;if($tobool_i){label=30;break}else{label=29;break};case 29:var $arrayidx159_i=$1+24|0;HEAPF32[$arrayidx159_i>>2]=9.999999682655225e-21;var $arrayidx159_1_i=$1+28|0;HEAPF32[$arrayidx159_1_i>>2]=9.999999682655225e-21;var $arrayidx159_2_i=$1+32|0;HEAPF32[$arrayidx159_2_i>>2]=9.999999682655225e-21;var $arrayidx159_3_i=$1+36|0;HEAPF32[$arrayidx159_3_i>>2]=9.999999682655225e-21;var $arrayidx159_4_i=$1+40|0;HEAPF32[$arrayidx159_4_i>>2]=9.999999682655225e-21;var $arrayidx159_5_i=$1+44|0;HEAPF32[$arrayidx159_5_i>>2]=9.999999682655225e-21;var $arrayidx159_6_i=$1+48|0;HEAPF32[$arrayidx159_6_i>>2]=9.999999682655225e-21;var $arrayidx159_7_i=$1+52|0;HEAPF32[$arrayidx159_7_i>>2]=9.999999682655225e-21;var $arrayidx159_8_i=$1+56|0;HEAPF32[$arrayidx159_8_i>>2]=9.999999682655225e-21;var $arrayidx159_9_i=$1+60|0;HEAPF32[$arrayidx159_9_i>>2]=9.999999682655225e-21;var $arrayidx159_10_i=$1+64|0;HEAPF32[$arrayidx159_10_i>>2]=9.999999682655225e-21;var $arrayidx159_11_i=$1+68|0;HEAPF32[$arrayidx159_11_i>>2]=9.999999682655225e-21;var $arrayidx159_12_i=$1+72|0;HEAPF32[$arrayidx159_12_i>>2]=9.999999682655225e-21;var $arrayidx159_13_i=$1+76|0;HEAPF32[$arrayidx159_13_i>>2]=9.999999682655225e-21;var $arrayidx159_14_i=$1+80|0;HEAPF32[$arrayidx159_14_i>>2]=9.999999682655225e-21;var $arrayidx159_15_i=$1+84|0;HEAPF32[$arrayidx159_15_i>>2]=9.999999682655225e-21;var $arrayidx159_16_i=$1+88|0;HEAPF32[$arrayidx159_16_i>>2]=9.999999682655225e-21;var $arrayidx159_17_i=$1+92|0;HEAPF32[$arrayidx159_17_i>>2]=9.999999682655225e-21;var $arrayidx159_18_i=$1+96|0;HEAPF32[$arrayidx159_18_i>>2]=9.999999682655225e-21;var $arrayidx159_19_i=$1+100|0;HEAPF32[$arrayidx159_19_i>>2]=9.999999682655225e-21;var $arrayidx159_20_i=$1+104|0;HEAPF32[$arrayidx159_20_i>>2]=9.999999682655225e-21;var $arrayidx159_21_i=$1+108|0;HEAPF32[$arrayidx159_21_i>>2]=9.999999682655225e-21;var $arrayidx167_i=$1+164|0;HEAPF32[$arrayidx167_i>>2]=9.999999682655225e-21;var $arrayidx167_1_i=$1+168|0;HEAPF32[$arrayidx167_1_i>>2]=9.999999682655225e-21;var $arrayidx167_2_i=$1+172|0;HEAPF32[$arrayidx167_2_i>>2]=9.999999682655225e-21;var $arrayidx167_3_i=$1+176|0;HEAPF32[$arrayidx167_3_i>>2]=9.999999682655225e-21;var $arrayidx167_4_i=$1+180|0;HEAPF32[$arrayidx167_4_i>>2]=9.999999682655225e-21;var $arrayidx167_5_i=$1+184|0;HEAPF32[$arrayidx167_5_i>>2]=9.999999682655225e-21;var $arrayidx175_i=$1+112|0;HEAPF32[$arrayidx175_i>>2]=9.999999682655225e-21;var $arrayidx175_1_i=$1+116|0;HEAPF32[$arrayidx175_1_i>>2]=9.999999682655225e-21;var $arrayidx175_2_i=$1+120|0;HEAPF32[$arrayidx175_2_i>>2]=9.999999682655225e-21;var $arrayidx175_3_i=$1+124|0;HEAPF32[$arrayidx175_3_i>>2]=9.999999682655225e-21;var $arrayidx175_4_i=$1+128|0;HEAPF32[$arrayidx175_4_i>>2]=9.999999682655225e-21;var $arrayidx175_5_i=$1+132|0;HEAPF32[$arrayidx175_5_i>>2]=9.999999682655225e-21;var $arrayidx175_6_i=$1+136|0;HEAPF32[$arrayidx175_6_i>>2]=9.999999682655225e-21;var $arrayidx175_7_i=$1+140|0;HEAPF32[$arrayidx175_7_i>>2]=9.999999682655225e-21;var $arrayidx175_8_i=$1+144|0;HEAPF32[$arrayidx175_8_i>>2]=9.999999682655225e-21;var $arrayidx175_9_i=$1+148|0;HEAPF32[$arrayidx175_9_i>>2]=9.999999682655225e-21;var $arrayidx175_10_i=$1+152|0;HEAPF32[$arrayidx175_10_i>>2]=9.999999682655225e-21;var $arrayidx175_11_i=$1+156|0;HEAPF32[$arrayidx175_11_i>>2]=9.999999682655225e-21;var $arrayidx175_12_i=$1+160|0;HEAPF32[$arrayidx175_12_i>>2]=9.999999682655225e-21;var $arrayidx183_i=$1+188|0;HEAPF32[$arrayidx183_i>>2]=9.999999682655225e-21;var $arrayidx183_1_i=$1+192|0;HEAPF32[$arrayidx183_1_i>>2]=9.999999682655225e-21;var $arrayidx183_2_i=$1+196|0;HEAPF32[$arrayidx183_2_i>>2]=9.999999682655225e-21;var $arrayidx183_3_i=$1+200|0;HEAPF32[$arrayidx183_3_i>>2]=9.999999682655225e-21;var $arrayidx183_4_i=$1+204|0;HEAPF32[$arrayidx183_4_i>>2]=9.999999682655225e-21;var $arrayidx183_5_i=$1+208|0;HEAPF32[$arrayidx183_5_i>>2]=9.999999682655225e-21;label=30;break;case 30:var $call_i152_i=_ATHformula($cfg1_i,-1);var $34=HEAPF32[$ATHfixpoint_i_i>>2];var $cmp_i154_i=$34>0;if($cmp_i154_i){label=31;break}else{label=32;break};case 31:var $sub_i155_i=$call_i152_i-$34;var $ath_0_i159_i=$sub_i155_i;label=33;break;case 32:var $sub2_i157_i=$call_i152_i-100;var $ath_0_i159_i=$sub2_i157_i;label=33;break;case 33:var $ath_0_i159_i;var $35=HEAPF32[$ATH_offset_db_i_i>>2];var $add_i161_i=$ath_0_i159_i+$35;var $mul_i162_i=$add_i161_i*.10000000149011612;var $36=Math.pow(10,$mul_i162_i);var $conv188_i=$36;var $call189_i=_log10($conv188_i);var $mul190_i=$call189_i*10;var $conv191_i=$mul190_i;var $37=HEAP32[$ATH_i>>2];var $floor_i=$37+20|0;HEAPF32[$floor_i>>2]=$conv191_i;HEAPF32[28808>>2]=0;var $i_0105=1;label=34;break;case 34:var $i_0105;var $conv=$i_0105|0;var $conv5=$conv;var $38=Math.pow($conv5,1.3333333333333333);var $conv6=$38;var $arrayidx=28808+($i_0105<<2)|0;HEAPF32[$arrayidx>>2]=$conv6;var $inc=$i_0105+1|0;var $cmp4=($inc|0)<8208;if($cmp4){var $i_0105=$inc;label=34;break}else{label=35;break};case 35:HEAPF32[113864>>2]=0;var $_pre=HEAPF32[28808>>2];var $i_1104=1;var $39=$_pre;label=36;break;case 36:var $39;var $i_1104;var $conv11=$i_1104|0;var $sub=$conv11+ -.5;var $arrayidx14=28808+($i_1104<<2)|0;var $40=HEAPF32[$arrayidx14>>2];var $add=$39+$40;var $conv15=$add;var $mul=$conv15*.5;var $41=Math.pow($mul,.75);var $sub16=$sub-$41;var $conv17=$sub16;var $arrayidx18=113864+($i_1104<<2)|0;HEAPF32[$arrayidx18>>2]=$conv17;var $inc20=$i_1104+1|0;var $cmp8=($inc20|0)<8208;if($cmp8){var $i_1104=$inc20;var $39=$40;label=36;break}else{var $i_2103=0;label=37;break};case 37:var $i_2103;var $sub26=$i_2103-210|0;var $conv27=$sub26|0;var $mul28=$conv27*-.1875;var $exp2=_exp2($mul28);var $conv29=$exp2;var $arrayidx30=95424+($i_2103<<2)|0;HEAPF32[$arrayidx30>>2]=$conv29;var $inc32=$i_2103+1|0;var $cmp23=($inc32|0)<257;if($cmp23){var $i_2103=$inc32;label=37;break}else{var $i_3102=0;label=38;break};case 38:var $i_3102;var $sub39=$i_3102-326|0;var $conv40=$sub39|0;var $mul41=$conv40*.25;var $exp284=_exp2($mul41);var $conv42=$exp284;var $arrayidx43=61640+($i_3102<<2)|0;HEAPF32[$arrayidx43>>2]=$conv42;var $inc45=$i_3102+1|0;var $cmp35=($inc45|0)<374;if($cmp35){var $i_3102=$inc45;label=38;break}else{label=39;break};case 39:_huffman_init($gfc);_init_xrpow_core_init($gfc);var $adjust_bass_db=$gfc+232|0;var $42=HEAPF32[$adjust_bass_db>>2];var $add49=$42+ -.5;var $mul50=$add49*.10000000149011612;var $43=Math.pow(10,$mul50);var $arrayidx55=$gfc+84768|0;HEAPF32[$arrayidx55>>2]=$43;var $arrayidx55_1=$gfc+84772|0;HEAPF32[$arrayidx55_1>>2]=$43;var $arrayidx55_2=$gfc+84776|0;HEAPF32[$arrayidx55_2>>2]=$43;var $arrayidx55_3=$gfc+84780|0;HEAPF32[$arrayidx55_3>>2]=$43;var $arrayidx55_4=$gfc+84784|0;HEAPF32[$arrayidx55_4>>2]=$43;var $arrayidx55_5=$gfc+84788|0;HEAPF32[$arrayidx55_5>>2]=$43;var $arrayidx55_6=$gfc+84792|0;HEAPF32[$arrayidx55_6>>2]=$43;var $adjust_alto_db=$gfc+228|0;var $44=HEAPF32[$adjust_alto_db>>2];var $add61=$44+ -.25;var $mul62=$add61*.10000000149011612;var $45=Math.pow(10,$mul62);var $arrayidx69=$gfc+84796|0;HEAPF32[$arrayidx69>>2]=$45;var $arrayidx69_1=$gfc+84800|0;HEAPF32[$arrayidx69_1>>2]=$45;var $arrayidx69_2=$gfc+84804|0;HEAPF32[$arrayidx69_2>>2]=$45;var $arrayidx69_3=$gfc+84808|0;HEAPF32[$arrayidx69_3>>2]=$45;var $arrayidx69_4=$gfc+84812|0;HEAPF32[$arrayidx69_4>>2]=$45;var $arrayidx69_5=$gfc+84816|0;HEAPF32[$arrayidx69_5>>2]=$45;var $arrayidx69_6=$gfc+84820|0;HEAPF32[$arrayidx69_6>>2]=$45;var $adjust_treble_db=$gfc+236|0;var $46=HEAPF32[$adjust_treble_db>>2];var $add75=$46+ -.02500000037252903;var $mul76=$add75*.10000000149011612;var $47=Math.pow(10,$mul76);var $i_696=14;label=40;break;case 40:var $i_696;var $arrayidx83=$gfc+84768+($i_696<<2)|0;HEAPF32[$arrayidx83>>2]=$47;var $inc85=$i_696+1|0;var $cmp78=($inc85|0)<21;if($cmp78){var $i_696=$inc85;label=40;break}else{label=41;break};case 41:var $adjust_sfb21_db=$gfc+240|0;var $48=HEAPF32[$adjust_sfb21_db>>2];var $add89=$48+.5;var $mul90=$add89*.10000000149011612;var $49=Math.pow(10,$mul90);var $arrayidx97=$gfc+84852|0;HEAPF32[$arrayidx97>>2]=$49;var $50=HEAPF32[$adjust_bass_db>>2];var $add104=$50-2;var $mul105=$add104*.10000000149011612;var $51=Math.pow(10,$mul105);var $arrayidx111=$gfc+84856|0;HEAPF32[$arrayidx111>>2]=$51;var $arrayidx111_1=$gfc+84860|0;HEAPF32[$arrayidx111_1>>2]=$51;var $arrayidx111_2=$gfc+84864|0;HEAPF32[$arrayidx111_2>>2]=$51;var $52=HEAPF32[$adjust_alto_db>>2];var $add118=$52-1;var $mul119=$add118*.10000000149011612;var $53=Math.pow(10,$mul119);var $arrayidx126=$gfc+84868|0;HEAPF32[$arrayidx126>>2]=$53;var $arrayidx126_1=$gfc+84872|0;HEAPF32[$arrayidx126_1>>2]=$53;var $arrayidx126_2=$gfc+84876|0;HEAPF32[$arrayidx126_2>>2]=$53;var $arrayidx126_3=$gfc+84880|0;HEAPF32[$arrayidx126_3>>2]=$53;var $54=HEAPF32[$adjust_treble_db>>2];var $add133=$54+ -.05000000074505806;var $mul134=$add133*.10000000149011612;var $55=Math.pow(10,$mul134);var $i_1088=7;label=42;break;case 42:var $i_1088;var $arrayidx141=$gfc+84856+($i_1088<<2)|0;HEAPF32[$arrayidx141>>2]=$55;var $inc143=$i_1088+1|0;var $cmp136=($inc143|0)<12;if($cmp136){var $i_1088=$inc143;label=42;break}else{label=43;break};case 43:var $56=HEAPF32[$adjust_sfb21_db>>2];var $add148=$56+.5;var $mul149=$add148*.10000000149011612;var $57=Math.pow(10,$mul149);var $arrayidx156=$gfc+84904|0;HEAPF32[$arrayidx156>>2]=$57;label=44;break;case 44:return}}function _on_pe($gfc,$pe,$targ_bits,$mean_bits,$gr,$cbr){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+24|0;label=1;while(1)switch(label){case 1:var $extra_bits=sp;var $tbits=sp+8;var $add_bits=sp+16;var $tmpcast=$add_bits;HEAP32[$extra_bits>>2]=0;var $$etemp$0$0=0;var $$etemp$0$1=0;var $st$1$0=$add_bits|0;HEAP32[$st$1$0>>2]=$$etemp$0$0;var $st$2$1=$add_bits+4|0;HEAP32[$st$2$1>>2]=$$etemp$0$1;_ResvMaxBits($gfc,$mean_bits,$tbits,$extra_bits,$cbr);var $0=HEAP32[$tbits>>2];var $1=HEAP32[$extra_bits>>2];var $add=$1+$0|0;var $cmp=($add|0)>7680;var $_add=$cmp?7680:$add;var $channels_out=$gfc+72|0;var $2=HEAP32[$channels_out>>2];var $cmp271=($2|0)>0;if($cmp271){label=2;break}else{label=15;break};case 2:var $mul17=$mean_bits*3&-1;var $div18=($mul17|0)/4&-1;var $bits_072=0;var $ch_073=0;var $3=$2;label=3;break;case 3:var $3;var $ch_073;var $bits_072;var $div=($0|0)/($3|0)&-1;var $cmp4=($div|0)>4095;var $_div=$cmp4?4095:$div;var $arrayidx=$targ_bits+($ch_073<<2)|0;HEAP32[$arrayidx>>2]=$_div;var $conv=$_div|0;var $arrayidx9=$pe+($gr<<3)+($ch_073<<2)|0;var $4=HEAPF32[$arrayidx9>>2];var $mul=$4*$conv;var $conv10=$mul;var $div11=$conv10/700;var $conv13=$_div|0;var $sub=$div11-$conv13;var $conv14=$sub&-1;var $arrayidx15=$tmpcast+($ch_073<<2)|0;var $cmp19=($conv14|0)>($div18|0);var $storemerge=$cmp19?$div18:$conv14;var $cmp27=($storemerge|0)<0;var $_storemerge=$cmp27?0:$storemerge;var $add34=$_storemerge+$_div|0;var $cmp35=($add34|0)>4095;if($cmp35){label=4;break}else{var $storemerge78=$_storemerge;label=5;break};case 4:var $sub39=4095-$_div|0;var $cmp40=($sub39|0)<0;var $_sub39=$cmp40?0:$sub39;var $storemerge78=$_sub39;label=5;break;case 5:var $storemerge78;HEAP32[$arrayidx15>>2]=$storemerge78;var $add51=$storemerge78+$bits_072|0;var $inc=$ch_073+1|0;var $5=HEAP32[$channels_out>>2];var $cmp2=($inc|0)<($5|0);if($cmp2){var $bits_072=$add51;var $ch_073=$inc;var $3=$5;label=3;break}else{label=6;break};case 6:var $cmp52=($add51|0)>($1|0);var $cmp54=($add51|0)>0;var $or_cond=$cmp52&$cmp54;if($or_cond){label=7;break}else{label=8;break};case 7:var $cmp5969=($5|0)>0;if($cmp5969){var $ch_170=0;label=9;break}else{label=15;break};case 8:var $cmp7266=($5|0)>0;if($cmp7266){var $ch_267=0;var $sub7968=$1;label=11;break}else{label=15;break};case 9:var $ch_170;var $arrayidx62=$tmpcast+($ch_170<<2)|0;var $6=HEAP32[$arrayidx62>>2];var $mul63=Math.imul($6,$1)|0;var $div64=($mul63|0)/($add51|0)&-1;HEAP32[$arrayidx62>>2]=$div64;var $inc67=$ch_170+1|0;var $cmp59=($inc67|0)<($5|0);if($cmp59){var $ch_170=$inc67;label=9;break}else{label=8;break};case 10:HEAP32[$extra_bits>>2]=$sub79;var $cmp8563=($9|0)>0;if($cmp8563){var $bits_164=0;var $ch_365=0;label=12;break}else{label=15;break};case 11:var $sub7968;var $ch_267;var $arrayidx75=$tmpcast+($ch_267<<2)|0;var $7=HEAP32[$arrayidx75>>2];var $arrayidx76=$targ_bits+($ch_267<<2)|0;var $8=HEAP32[$arrayidx76>>2];var $add77=$8+$7|0;HEAP32[$arrayidx76>>2]=$add77;var $sub79=$sub7968-$7|0;var $inc81=$ch_267+1|0;var $9=HEAP32[$channels_out>>2];var $cmp72=($inc81|0)<($9|0);if($cmp72){var $ch_267=$inc81;var $sub7968=$sub79;label=11;break}else{label=10;break};case 12:var $ch_365;var $bits_164;var $arrayidx88=$targ_bits+($ch_365<<2)|0;var $10=HEAP32[$arrayidx88>>2];var $add89=$10+$bits_164|0;var $inc91=$ch_365+1|0;var $cmp85=($inc91|0)<($9|0);if($cmp85){var $bits_164=$add89;var $ch_365=$inc91;label=12;break}else{label=13;break};case 13:var $cmp93_not=($add89|0)<7681;var $cmp8563_not=$cmp8563^1;var $brmerge=$cmp93_not|$cmp8563_not;if($brmerge){label=15;break}else{var $ch_462=0;label=14;break};case 14:var $ch_462;var $arrayidx101=$targ_bits+($ch_462<<2)|0;var $11=HEAP32[$arrayidx101>>2];var $mul102=$11*7680&-1;var $div104=($mul102|0)/($add89|0)&-1;HEAP32[$arrayidx101>>2]=$div104;var $inc108=$ch_462+1|0;var $12=HEAP32[$channels_out>>2];var $cmp98=($inc108|0)<($12|0);if($cmp98){var $ch_462=$inc108;label=14;break}else{label=15;break};case 15:STACKTOP=sp;return $_add}}function _reduce_side($targ_bits,$ms_ener_ratio,$mean_bits,$max_bits){var label=0;label=1;while(1)switch(label){case 1:var $conv=$ms_ener_ratio;var $sub=.5-$conv;var $mul=$sub*.33;var $div=$mul*2;var $conv1=$div;var $cmp=$conv1<0;var $fac_0=$cmp?0:$conv1;var $cmp4=$fac_0>.5;var $0=$fac_0;var $_op=$0*.5;var $mul9=$cmp4?.25:$_op;var $1=HEAP32[$targ_bits>>2];var $arrayidx10=$targ_bits+4|0;var $2=HEAP32[$arrayidx10>>2];var $add=$2+$1|0;var $conv11=$add|0;var $mul12=$mul9*$conv11;var $conv13=$mul12&-1;var $sub15=4095-$1|0;var $cmp16=($conv13|0)>($sub15|0);var $sub15_conv13=$cmp16?$sub15:$conv13;var $cmp22=($sub15_conv13|0)<0;var $move_bits_1=$cmp22?0:$sub15_conv13;var $cmp27=($2|0)>124;if($cmp27){label=2;break}else{var $5=$1;var $4=$2;label=7;break};case 2:var $sub31=$2-$move_bits_1|0;var $cmp32=($sub31|0)>125;if($cmp32){label=3;break}else{label=6;break};case 3:var $cmp36=($1|0)<($mean_bits|0);if($cmp36){label=4;break}else{var $3=$1;label=5;break};case 4:var $add40=$move_bits_1+$1|0;HEAP32[$targ_bits>>2]=$add40;var $3=$add40;label=5;break;case 5:var $3;HEAP32[$arrayidx10>>2]=$sub31;var $5=$3;var $4=$sub31;label=7;break;case 6:var $sub45=$1-125|0;var $add47=$sub45+$2|0;HEAP32[$targ_bits>>2]=$add47;HEAP32[$arrayidx10>>2]=125;var $5=$add47;var $4=125;label=7;break;case 7:var $4;var $5;var $add53=$4+$5|0;var $cmp54=($add53|0)>($max_bits|0);if($cmp54){label=8;break}else{label=9;break};case 8:var $mul58=Math.imul($5,$max_bits)|0;var $div59=($mul58|0)/($add53|0)&-1;HEAP32[$targ_bits>>2]=$div59;var $mul62=Math.imul($4,$max_bits)|0;var $div63=($mul62|0)/($add53|0)&-1;HEAP32[$arrayidx10>>2]=$div63;label=9;break;case 9:return}}function _athAdjust($a,$x,$athFloor,$ATHfixpoint){var label=0;label=1;while(1)switch(label){case 1:var $cmp=$ATHfixpoint<1;var $cond=$cmp?94.82444763183594:$ATHfixpoint;var $call=_fast_log2($x);var $conv=$call;var $mul=$conv*3.0102999566398116;var $conv1=$mul;var $mul2=$a*$a;var $sub=$conv1-$athFloor;var $cmp3=$mul2>9.999999682655225e-21;if($cmp3){label=2;break}else{var $w_0=0;label=3;break};case 2:var $call5=_fast_log2($mul2);var $conv6=$call5;var $mul7=$conv6*.03333343265598758;var $add=$mul7+1;var $conv8=$add;var $w_0=$conv8;label=3;break;case 3:var $w_0;var $cmp9=$w_0<0;var $w_1=$cmp9?0:$w_0;var $mul13=$sub*$w_1;var $add14=$athFloor+90.30873107910156;var $sub15=$add14-$cond;var $add16=$sub15+$mul13;var $mul17=$add16*.10000000149011612;var $0=Math.pow(10,$mul17);return $0}}function _calc_xmin($gfc,$ratio,$cod_info,$pxmin){var label=0;label=1;while(1)switch(label){case 1:var $ATH2=$gfc+85796|0;var $0=HEAP32[$ATH2>>2];var $psy_lmax=$cod_info+4856|0;var $1=HEAP32[$psy_lmax>>2];var $cmp182=($1|0)>0;if($cmp182){label=2;break}else{var $ath_over_0_lcssa=0;var $j_0_lcssa=0;var $gsfb_0_lcssa=0;var $pxmin_addr_0_lcssa=$pxmin;label=3;break};case 2:var $adjust_factor=$0+8|0;var $floor=$0+20|0;var $ATHfixpoint=$gfc+224|0;var $ath_over_0183=0;var $j_0184=0;var $gsfb_0185=0;var $pxmin_addr_0186=$pxmin;label=4;break;case 3:var $pxmin_addr_0_lcssa;var $gsfb_0_lcssa;var $j_0_lcssa;var $ath_over_0_lcssa;var $k_0=575;label=15;break;case 4:var $pxmin_addr_0186;var $gsfb_0185;var $j_0184;var $ath_over_0183;var $2=HEAPF32[$adjust_factor>>2];var $arrayidx=$0+24+($gsfb_0185<<2)|0;var $3=HEAPF32[$arrayidx>>2];var $4=HEAPF32[$floor>>2];var $5=HEAPF32[$ATHfixpoint>>2];var $cmp_i=$5<1;var $cond_i=$cmp_i?94.82444763183594:$5;var $call_i=_fast_log2($3);var $conv_i=$call_i;var $mul_i=$conv_i*3.0102999566398116;var $conv1_i=$mul_i;var $mul2_i=$2*$2;var $sub_i=$conv1_i-$4;var $cmp3_i=$mul2_i>9.999999682655225e-21;if($cmp3_i){label=5;break}else{var $w_0_i=0;label=6;break};case 5:var $call5_i=_fast_log2($mul2_i);var $conv6_i=$call5_i;var $mul7_i=$conv6_i*.03333343265598758;var $add_i=$mul7_i+1;var $conv8_i=$add_i;var $w_0_i=$conv8_i;label=6;break;case 6:var $w_0_i;var $cmp9_i=$w_0_i<0;var $w_1_i=$cmp9_i?0:$w_0_i;var $mul13_i=$sub_i*$w_1_i;var $add14_i=$4+90.30873107910156;var $sub15_i=$add14_i-$cond_i;var $add16_i=$sub15_i+$mul13_i;var $mul17_i=$add16_i*.10000000149011612;var $6=Math.pow(10,$mul17_i);var $arrayidx5=$gfc+84768+($gsfb_0185<<2)|0;var $7=HEAPF32[$arrayidx5>>2];var $mul=$6*$7;var $arrayidx7=$cod_info+4872+($gsfb_0185<<2)|0;var $8=HEAP32[$arrayidx7>>2];var $conv=$8|0;var $div=$mul/$conv;var $cmp9174=($8|0)>0;if($cmp9174){var $l_0175=0;var $rh2_0176=2.220446049250313e-16;var $en0_0177=0;var $j_1178=$j_0184;label=7;break}else{var $rh2_0_lcssa=2.220446049250313e-16;var $en0_0_lcssa=0;var $j_1_lcssa=$j_0184;label=9;break};case 7:var $j_1178;var $en0_0177;var $rh2_0176;var $l_0175;var $inc=$j_1178+1|0;var $arrayidx12=$cod_info+($j_1178<<2)|0;var $9=HEAPF32[$arrayidx12>>2];var $mul13=$9*$9;var $add=$en0_0177+$mul13;var $cmp14=$mul13<$div;var $cond=$cmp14?$mul13:$div;var $add16=$rh2_0176+$cond;var $inc17=$l_0175+1|0;var $cmp9=($inc17|0)<($8|0);if($cmp9){var $l_0175=$inc17;var $rh2_0176=$add16;var $en0_0177=$add;var $j_1178=$inc;label=7;break}else{label=8;break};case 8:var $10=$j_0184+$8|0;var $rh2_0_lcssa=$add16;var $en0_0_lcssa=$add;var $j_1_lcssa=$10;label=9;break;case 9:var $j_1_lcssa;var $en0_0_lcssa;var $rh2_0_lcssa;var $cmp18=$en0_0_lcssa>$mul;var $inc20=$cmp18&1;var $ath_over_1=$inc20+$ath_over_0183|0;var $cmp21=$en0_0_lcssa<$mul;if($cmp21){var $rh3_0=$en0_0_lcssa;label=11;break}else{label=10;break};case 10:var $cmp24=$rh2_0_lcssa<$mul;var $mul_rh2_0=$cmp24?$mul:$rh2_0_lcssa;var $rh3_0=$mul_rh2_0;label=11;break;case 11:var $rh3_0;var $arrayidx31=$ratio+244+($gsfb_0185<<2)|0;var $11=HEAPF32[$arrayidx31>>2];var $cmp32=$11>9.999999960041972e-13;if($cmp32){label=12;break}else{var $xmin_0=$rh3_0;label=14;break};case 12:var $arrayidx36=$ratio+($gsfb_0185<<2)|0;var $12=HEAPF32[$arrayidx36>>2];var $mul37=$en0_0_lcssa*$12;var $div38=$mul37/$11;var $mul42=$div38*$7;var $cmp43=$rh3_0<$mul42;if($cmp43){label=13;break}else{var $xmin_0=$rh3_0;label=14;break};case 13:var $xmin_0=$mul42;label=14;break;case 14:var $xmin_0;var $cmp49=$xmin_0>2.220446049250313e-16;var $cond55=$cmp49?$xmin_0:2.220446049250313e-16;var $add57=$cond55+9.9999998245167e-15;var $cmp58=$en0_0_lcssa>$add57;var $conv61=$cmp58&1;var $arrayidx62=$gsfb_0185+($cod_info+5212)|0;HEAP8[$arrayidx62]=$conv61;var $incdec_ptr=$pxmin_addr_0186+4|0;HEAPF32[$pxmin_addr_0186>>2]=$cond55;var $inc64=$gsfb_0185+1|0;var $13=HEAP32[$psy_lmax>>2];var $cmp=($inc64|0)<($13|0);if($cmp){var $ath_over_0183=$ath_over_1;var $j_0184=$j_1_lcssa;var $gsfb_0185=$inc64;var $pxmin_addr_0186=$incdec_ptr;label=4;break}else{var $ath_over_0_lcssa=$ath_over_1;var $j_0_lcssa=$j_1_lcssa;var $gsfb_0_lcssa=$inc64;var $pxmin_addr_0_lcssa=$incdec_ptr;label=3;break};case 15:var $k_0;var $cmp67=($k_0|0)>0;if($cmp67){label=16;break}else{var $max_nonzero_0=0;label=17;break};case 16:var $arrayidx70=$cod_info+($k_0<<2)|0;var $14=HEAPF32[$arrayidx70>>2];var $fabsf=Math.abs($14);var $cmp73=$fabsf>9.999999960041972e-13;var $dec=$k_0-1|0;if($cmp73){var $max_nonzero_0=$k_0;label=17;break}else{var $k_0=$dec;label=15;break};case 17:var $max_nonzero_0;var $block_type=$cod_info+4788|0;var $15=HEAP32[$block_type>>2];var $cmp79=($15|0)==2;if($cmp79){label=19;break}else{label=18;break};case 18:var $or=$max_nonzero_0|1;var $max_nonzero_1=$or;label=20;break;case 19:var $div83=($max_nonzero_0|0)%6&-1;var $mul84=$max_nonzero_0+5|0;var $add85=$mul84-$div83|0;var $max_nonzero_1=$add85;label=20;break;case 20:var $max_nonzero_1;var $sfb21_extra=$gfc+85092|0;var $16=HEAP32[$sfb21_extra>>2];var $cmp88=($16|0)==0;if($cmp88){label=21;break}else{var $max_nonzero_2=$max_nonzero_1;label=26;break};case 21:var $samplerate_out=$gfc+64|0;var $17=HEAP32[$samplerate_out>>2];var $cmp90=($17|0)<44e3;if($cmp90){label=22;break}else{var $max_nonzero_2=$max_nonzero_1;label=26;break};case 22:var $cmp94=($17|0)<8001;if($cmp79){label=24;break}else{label=23;break};case 23:var $cond96=$cmp94?17:21;var $arrayidx106=$gfc+21360+($cond96<<2)|0;var $18=HEAP32[$arrayidx106>>2];var $limit_0_in=$18;label=25;break;case 24:var $cond100=$cmp94?9:12;var $arrayidx109=$gfc+21452+($cond100<<2)|0;var $19=HEAP32[$arrayidx109>>2];var $mul110=$19*3&-1;var $limit_0_in=$mul110;label=25;break;case 25:var $limit_0_in;var $limit_0=$limit_0_in-1|0;var $cmp113=($max_nonzero_1|0)>($limit_0|0);var $limit_0_max_nonzero_1=$cmp113?$limit_0:$max_nonzero_1;var $max_nonzero_2=$limit_0_max_nonzero_1;label=26;break;case 26:var $max_nonzero_2;var $max_nonzero_coeff=$cod_info+5208|0;HEAP32[$max_nonzero_coeff>>2]=$max_nonzero_2;var $psymax=$cod_info+4864|0;var $20=HEAP32[$psymax>>2];var $cmp119165=($gsfb_0_lcssa|0)<($20|0);if($cmp119165){label=27;break}else{var $ath_over_2_lcssa=$ath_over_0_lcssa;label=48;break};case 27:var $sfb_smin=$cod_info+4852|0;var $21=HEAP32[$sfb_smin>>2];var $adjust_factor124=$0+8|0;var $floor127=$0+20|0;var $ATHfixpoint128=$gfc+224|0;var $use_temporal_masking_effect=$gfc+92|0;var $cd_psy=$gfc+85800|0;var $ath_over_2166=$ath_over_0_lcssa;var $j_2167=$j_0_lcssa;var $gsfb_1168=$gsfb_0_lcssa;var $sfb_0170=$21;var $pxmin_addr_1172=$pxmin_addr_0_lcssa;label=28;break;case 28:var $pxmin_addr_1172;var $sfb_0170;var $gsfb_1168;var $j_2167;var $ath_over_2166;var $22=HEAPF32[$adjust_factor124>>2];var $arrayidx126=$0+112+($sfb_0170<<2)|0;var $23=HEAPF32[$arrayidx126>>2];var $24=HEAPF32[$floor127>>2];var $25=HEAPF32[$ATHfixpoint128>>2];var $cmp_i130=$25<1;var $cond_i131=$cmp_i130?94.82444763183594:$25;var $call_i132=_fast_log2($23);var $conv_i133=$call_i132;var $mul_i134=$conv_i133*3.0102999566398116;var $conv1_i135=$mul_i134;var $mul2_i136=$22*$22;var $sub_i137=$conv1_i135-$24;var $cmp3_i138=$mul2_i136>9.999999682655225e-21;if($cmp3_i138){label=29;break}else{var $w_0_i145=0;label=30;break};case 29:var $call5_i139=_fast_log2($mul2_i136);var $conv6_i140=$call5_i139;var $mul7_i141=$conv6_i140*.03333343265598758;var $add_i142=$mul7_i141+1;var $conv8_i143=$add_i142;var $w_0_i145=$conv8_i143;label=30;break;case 30:var $w_0_i145;var $cmp9_i146=$w_0_i145<0;var $w_1_i147=$cmp9_i146?0:$w_0_i145;var $mul13_i148=$sub_i137*$w_1_i147;var $add14_i149=$24+90.30873107910156;var $sub15_i150=$add14_i149-$cond_i131;var $add16_i151=$sub15_i150+$mul13_i148;var $mul17_i152=$add16_i151*.10000000149011612;var $26=Math.pow(10,$mul17_i152);var $arrayidx131=$gfc+84856+($sfb_0170<<2)|0;var $27=HEAPF32[$arrayidx131>>2];var $mul132=$26*$27;var $arrayidx134=$cod_info+4872+($gsfb_1168<<2)|0;var $28=HEAP32[$arrayidx134>>2];var $conv144=$28|0;var $div145=$mul132/$conv144;var $cmp147154=($28|0)>0;if($cmp147154){var $l123_0155_us=0;var $en0139_0156_us=0;var $j_4157_us=$j_2167;var $rh2142_0158_us=2.220446049250313e-16;label=36;break}else{label=37;break};case 31:var $29=$28+$j_2167|0;var $cmp166_us=$add155_us>$mul132;var $inc169_us=$cmp166_us&1;var $ath_over_4_us=$inc169_us+$ath_over_2166|0;var $cmp171_us=$add155_us<$mul132;if($cmp171_us){var $rh3143_0_us=$add155_us;label=33;break}else{label=32;break};case 32:var $cmp175_us=$add162_us<$mul132;var $mul132_rh2142_0_us=$cmp175_us?$mul132:$add162_us;var $rh3143_0_us=$mul132_rh2142_0_us;label=33;break;case 33:var $rh3143_0_us;var $arrayidx185_us=$ratio+332+($sfb_0170*12&-1)|0;var $30=HEAPF32[$arrayidx185_us>>2];var $cmp186_us=$30>9.999999960041972e-13;if($cmp186_us){label=34;break}else{var $xmin140_0_us=$rh3143_0_us;label=60;break};case 34:var $arrayidx193_us=$ratio+88+($sfb_0170*12&-1)|0;var $31=HEAPF32[$arrayidx193_us>>2];var $mul194_us=$add155_us*$31;var $div195_us=$mul194_us/$30;var $mul199_us=$div195_us*$27;var $cmp200_us=$rh3143_0_us<$mul199_us;if($cmp200_us){label=35;break}else{var $xmin140_0_us=$rh3143_0_us;label=60;break};case 35:var $xmin140_0_us=$mul199_us;label=60;break;case 36:var $rh2142_0158_us;var $j_4157_us;var $en0139_0156_us;var $l123_0155_us;var $inc151_us=$j_4157_us+1|0;var $arrayidx152_us=$cod_info+($j_4157_us<<2)|0;var $32=HEAPF32[$arrayidx152_us>>2];var $mul154_us=$32*$32;var $add155_us=$en0139_0156_us+$mul154_us;var $cmp156_us=$mul154_us<$div145;var $cond161_us=$cmp156_us?$mul154_us:$div145;var $add162_us=$rh2142_0158_us+$cond161_us;var $inc164_us=$l123_0155_us+1|0;var $cmp147_us=($inc164_us|0)<($28|0);if($cmp147_us){var $l123_0155_us=$inc164_us;var $en0139_0156_us=$add155_us;var $j_4157_us=$inc151_us;var $rh2142_0158_us=$add162_us;label=36;break}else{label=31;break};case 37:var $cmp166=$mul132<0;var $inc169=$cmp166&1;var $ath_over_4=$inc169+$ath_over_2166|0;var $cmp171=$mul132>0;if($cmp171){var $rh3143_0=0;label=39;break}else{label=38;break};case 38:var $cmp175=$mul132>2.220446049250313e-16;var $mul132_rh2142_0=$cmp175?$mul132:2.220446049250313e-16;var $rh3143_0=$mul132_rh2142_0;label=39;break;case 39:var $rh3143_0;var $arrayidx185=$ratio+332+($sfb_0170*12&-1)|0;var $33=HEAPF32[$arrayidx185>>2];var $cmp186=$33>9.999999960041972e-13;if($cmp186){label=40;break}else{var $xmin140_0=$rh3143_0;label=49;break};case 40:var $arrayidx193=$ratio+88+($sfb_0170*12&-1)|0;var $34=HEAPF32[$arrayidx193>>2];var $mul194=$34*0;var $div195=$mul194/$33;var $mul199=$div195*$27;var $cmp200=$rh3143_0<$mul199;if($cmp200){label=41;break}else{var $xmin140_0=$rh3143_0;label=49;break};case 41:var $xmin140_0=$mul199;label=49;break;case 42:var $j_3_lcssa;var $ath_over_3_lcssa;var $pxmin_addr_2_lcssa=$pxmin_addr_1172+12|0;var $35=HEAP32[$use_temporal_masking_effect>>2];var $tobool=($35|0)==0;if($tobool){label=47;break}else{label=43;break};case 43:var $36=HEAPF32[$pxmin_addr_1172>>2];var $arrayidx228=$pxmin_addr_1172+4|0;var $37=HEAPF32[$arrayidx228>>2];var $cmp229=$36>$37;if($cmp229){label=44;break}else{var $40=$37;label=45;break};case 44:var $sub234=$36-$37;var $38=HEAP32[$cd_psy>>2];var $decay=$38+6496|0;var $39=HEAPF32[$decay>>2];var $mul235=$sub234*$39;var $add237=$37+$mul235;HEAPF32[$arrayidx228>>2]=$add237;var $40=$add237;label=45;break;case 45:var $40;var $arrayidx240=$pxmin_addr_1172+8|0;var $41=HEAPF32[$arrayidx240>>2];var $cmp241=$40>$41;if($cmp241){label=46;break}else{label=47;break};case 46:var $sub246=$40-$41;var $42=HEAP32[$cd_psy>>2];var $decay248=$42+6496|0;var $43=HEAPF32[$decay248>>2];var $mul249=$sub246*$43;var $add251=$41+$mul249;HEAPF32[$arrayidx240>>2]=$add251;label=47;break;case 47:var $inc255=$sfb_0170+1|0;var $add256=$gsfb_1168+3|0;var $44=HEAP32[$psymax>>2];var $cmp119=($add256|0)<($44|0);if($cmp119){var $ath_over_2166=$ath_over_3_lcssa;var $j_2167=$j_3_lcssa;var $gsfb_1168=$add256;var $sfb_0170=$inc255;var $pxmin_addr_1172=$pxmin_addr_2_lcssa;label=28;break}else{var $ath_over_2_lcssa=$ath_over_3_lcssa;label=48;break};case 48:var $ath_over_2_lcssa;return $ath_over_2_lcssa;case 49:var $xmin140_0;var $cmp206=$xmin140_0>2.220446049250313e-16;var $cond212=$cmp206?$xmin140_0:2.220446049250313e-16;var $add214=$cond212+9.9999998245167e-15;var $cmp215=$add214<0;var $conv218=$cmp215&1;var $arrayidx221=$gsfb_1168+($cod_info+5212)|0;HEAP8[$arrayidx221]=$conv218;var $incdec_ptr222=$pxmin_addr_1172+4|0;HEAPF32[$pxmin_addr_1172>>2]=$cond212;var $ath_over_4_1=$inc169+$ath_over_4|0;if($cmp171){var $rh3143_0_1=0;label=51;break}else{label=50;break};case 50:var $cmp175_1=$mul132>2.220446049250313e-16;var $mul132_rh2142_0_1=$cmp175_1?$mul132:2.220446049250313e-16;var $rh3143_0_1=$mul132_rh2142_0_1;label=51;break;case 51:var $rh3143_0_1;var $arrayidx185_1=$ratio+332+($sfb_0170*12&-1)+4|0;var $45=HEAPF32[$arrayidx185_1>>2];var $cmp186_1=$45>9.999999960041972e-13;if($cmp186_1){label=52;break}else{var $xmin140_0_1=$rh3143_0_1;label=54;break};case 52:var $arrayidx193_1=$ratio+88+($sfb_0170*12&-1)+4|0;var $46=HEAPF32[$arrayidx193_1>>2];var $mul194_1=$46*0;var $div195_1=$mul194_1/$45;var $47=HEAPF32[$arrayidx131>>2];var $mul199_1=$div195_1*$47;var $cmp200_1=$rh3143_0_1<$mul199_1;if($cmp200_1){label=53;break}else{var $xmin140_0_1=$rh3143_0_1;label=54;break};case 53:var $xmin140_0_1=$mul199_1;label=54;break;case 54:var $xmin140_0_1;var $cmp206_1=$xmin140_0_1>2.220446049250313e-16;var $cond212_1=$cmp206_1?$xmin140_0_1:2.220446049250313e-16;var $add214_1=$cond212_1+9.9999998245167e-15;var $cmp215_1=$add214_1<0;var $conv218_1=$cmp215_1&1;var $add219_1=$gsfb_1168+1|0;var $arrayidx221_1=$add219_1+($cod_info+5212)|0;HEAP8[$arrayidx221_1]=$conv218_1;var $incdec_ptr222_1=$pxmin_addr_1172+8|0;HEAPF32[$incdec_ptr222>>2]=$cond212_1;var $ath_over_4_2=$inc169+$ath_over_4_1|0;if($cmp171){var $rh3143_0_2=0;label=56;break}else{label=55;break};case 55:var $cmp175_2=$mul132>2.220446049250313e-16;var $mul132_rh2142_0_2=$cmp175_2?$mul132:2.220446049250313e-16;var $rh3143_0_2=$mul132_rh2142_0_2;label=56;break;case 56:var $rh3143_0_2;var $arrayidx185_2=$ratio+332+($sfb_0170*12&-1)+8|0;var $48=HEAPF32[$arrayidx185_2>>2];var $cmp186_2=$48>9.999999960041972e-13;if($cmp186_2){label=57;break}else{var $xmin140_0_2=$rh3143_0_2;label=59;break};case 57:var $arrayidx193_2=$ratio+88+($sfb_0170*12&-1)+8|0;var $49=HEAPF32[$arrayidx193_2>>2];var $mul194_2=$49*0;var $div195_2=$mul194_2/$48;var $50=HEAPF32[$arrayidx131>>2];var $mul199_2=$div195_2*$50;var $cmp200_2=$rh3143_0_2<$mul199_2;if($cmp200_2){label=58;break}else{var $xmin140_0_2=$rh3143_0_2;label=59;break};case 58:var $xmin140_0_2=$mul199_2;label=59;break;case 59:var $xmin140_0_2;var $cmp206_2=$xmin140_0_2>2.220446049250313e-16;var $cond212_2=$cmp206_2?$xmin140_0_2:2.220446049250313e-16;var $add214_2=$cond212_2+9.9999998245167e-15;var $cmp215_2=$add214_2<0;var $conv218_2=$cmp215_2&1;var $add219_2=$gsfb_1168+2|0;var $arrayidx221_2=$add219_2+($cod_info+5212)|0;HEAP8[$arrayidx221_2]=$conv218_2;HEAPF32[$incdec_ptr222_1>>2]=$cond212_2;var $ath_over_3_lcssa=$ath_over_4_2;var $j_3_lcssa=$j_2167;label=42;break;case 60:var $xmin140_0_us;var $cmp206_us=$xmin140_0_us>2.220446049250313e-16;var $cond212_us=$cmp206_us?$xmin140_0_us:2.220446049250313e-16;var $add214_us=$cond212_us+9.9999998245167e-15;var $cmp215_us=$add155_us>$add214_us;var $conv218_us=$cmp215_us&1;var $arrayidx221_us=$gsfb_1168+($cod_info+5212)|0;HEAP8[$arrayidx221_us]=$conv218_us;var $incdec_ptr222_us=$pxmin_addr_1172+4|0;HEAPF32[$pxmin_addr_1172>>2]=$cond212_us;var $l123_0155_us_1=0;var $en0139_0156_us_1=0;var $j_4157_us_1=$29;var $rh2142_0158_us_1=2.220446049250313e-16;label=61;break;case 61:var $rh2142_0158_us_1;var $j_4157_us_1;var $en0139_0156_us_1;var $l123_0155_us_1;var $inc151_us_1=$j_4157_us_1+1|0;var $arrayidx152_us_1=$cod_info+($j_4157_us_1<<2)|0;var $51=HEAPF32[$arrayidx152_us_1>>2];var $mul154_us_1=$51*$51;var $add155_us_1=$en0139_0156_us_1+$mul154_us_1;var $cmp156_us_1=$mul154_us_1<$div145;var $cond161_us_1=$cmp156_us_1?$mul154_us_1:$div145;var $add162_us_1=$rh2142_0158_us_1+$cond161_us_1;var $inc164_us_1=$l123_0155_us_1+1|0;var $cmp147_us_1=($inc164_us_1|0)<($28|0);if($cmp147_us_1){var $l123_0155_us_1=$inc164_us_1;var $en0139_0156_us_1=$add155_us_1;var $j_4157_us_1=$inc151_us_1;var $rh2142_0158_us_1=$add162_us_1;label=61;break}else{label=62;break};case 62:var $52=$28+$29|0;var $cmp166_us_1=$add155_us_1>$mul132;var $inc169_us_1=$cmp166_us_1&1;var $ath_over_4_us_1=$inc169_us_1+$ath_over_4_us|0;var $cmp171_us_1=$add155_us_1<$mul132;if($cmp171_us_1){var $rh3143_0_us_1=$add155_us_1;label=64;break}else{label=63;break};case 63:var $cmp175_us_1=$add162_us_1<$mul132;var $mul132_rh2142_0_us_1=$cmp175_us_1?$mul132:$add162_us_1;var $rh3143_0_us_1=$mul132_rh2142_0_us_1;label=64;break;case 64:var $rh3143_0_us_1;var $arrayidx185_us_1=$ratio+332+($sfb_0170*12&-1)+4|0;var $53=HEAPF32[$arrayidx185_us_1>>2];var $cmp186_us_1=$53>9.999999960041972e-13;if($cmp186_us_1){label=65;break}else{var $xmin140_0_us_1=$rh3143_0_us_1;label=67;break};case 65:var $arrayidx193_us_1=$ratio+88+($sfb_0170*12&-1)+4|0;var $54=HEAPF32[$arrayidx193_us_1>>2];var $mul194_us_1=$add155_us_1*$54;var $div195_us_1=$mul194_us_1/$53;var $55=HEAPF32[$arrayidx131>>2];var $mul199_us_1=$div195_us_1*$55;var $cmp200_us_1=$rh3143_0_us_1<$mul199_us_1;if($cmp200_us_1){label=66;break}else{var $xmin140_0_us_1=$rh3143_0_us_1;label=67;break};case 66:var $xmin140_0_us_1=$mul199_us_1;label=67;break;case 67:var $xmin140_0_us_1;var $cmp206_us_1=$xmin140_0_us_1>2.220446049250313e-16;var $cond212_us_1=$cmp206_us_1?$xmin140_0_us_1:2.220446049250313e-16;var $add214_us_1=$cond212_us_1+9.9999998245167e-15;var $cmp215_us_1=$add155_us_1>$add214_us_1;var $conv218_us_1=$cmp215_us_1&1;var $add219_us_1=$gsfb_1168+1|0;var $arrayidx221_us_1=$add219_us_1+($cod_info+5212)|0;HEAP8[$arrayidx221_us_1]=$conv218_us_1;var $incdec_ptr222_us_1=$pxmin_addr_1172+8|0;HEAPF32[$incdec_ptr222_us>>2]=$cond212_us_1;var $l123_0155_us_2=0;var $en0139_0156_us_2=0;var $j_4157_us_2=$52;var $rh2142_0158_us_2=2.220446049250313e-16;label=68;break;case 68:var $rh2142_0158_us_2;var $j_4157_us_2;var $en0139_0156_us_2;var $l123_0155_us_2;var $inc151_us_2=$j_4157_us_2+1|0;var $arrayidx152_us_2=$cod_info+($j_4157_us_2<<2)|0;var $56=HEAPF32[$arrayidx152_us_2>>2];var $mul154_us_2=$56*$56;var $add155_us_2=$en0139_0156_us_2+$mul154_us_2;var $cmp156_us_2=$mul154_us_2<$div145;var $cond161_us_2=$cmp156_us_2?$mul154_us_2:$div145;var $add162_us_2=$rh2142_0158_us_2+$cond161_us_2;var $inc164_us_2=$l123_0155_us_2+1|0;var $cmp147_us_2=($inc164_us_2|0)<($28|0);if($cmp147_us_2){var $l123_0155_us_2=$inc164_us_2;var $en0139_0156_us_2=$add155_us_2;var $j_4157_us_2=$inc151_us_2;var $rh2142_0158_us_2=$add162_us_2;label=68;break}else{label=69;break};case 69:var $57=$28+$52|0;var $cmp166_us_2=$add155_us_2>$mul132;var $inc169_us_2=$cmp166_us_2&1;var $ath_over_4_us_2=$inc169_us_2+$ath_over_4_us_1|0;var $cmp171_us_2=$add155_us_2<$mul132;if($cmp171_us_2){var $rh3143_0_us_2=$add155_us_2;label=71;break}else{label=70;break};case 70:var $cmp175_us_2=$add162_us_2<$mul132;var $mul132_rh2142_0_us_2=$cmp175_us_2?$mul132:$add162_us_2;var $rh3143_0_us_2=$mul132_rh2142_0_us_2;label=71;break;case 71:var $rh3143_0_us_2;var $arrayidx185_us_2=$ratio+332+($sfb_0170*12&-1)+8|0;var $58=HEAPF32[$arrayidx185_us_2>>2];var $cmp186_us_2=$58>9.999999960041972e-13;if($cmp186_us_2){label=72;break}else{var $xmin140_0_us_2=$rh3143_0_us_2;label=74;break};case 72:var $arrayidx193_us_2=$ratio+88+($sfb_0170*12&-1)+8|0;var $59=HEAPF32[$arrayidx193_us_2>>2];var $mul194_us_2=$add155_us_2*$59;var $div195_us_2=$mul194_us_2/$58;var $60=HEAPF32[$arrayidx131>>2];var $mul199_us_2=$div195_us_2*$60;var $cmp200_us_2=$rh3143_0_us_2<$mul199_us_2;if($cmp200_us_2){label=73;break}else{var $xmin140_0_us_2=$rh3143_0_us_2;label=74;break};case 73:var $xmin140_0_us_2=$mul199_us_2;label=74;break;case 74:var $xmin140_0_us_2;var $cmp206_us_2=$xmin140_0_us_2>2.220446049250313e-16;var $cond212_us_2=$cmp206_us_2?$xmin140_0_us_2:2.220446049250313e-16;var $add214_us_2=$cond212_us_2+9.9999998245167e-15;var $cmp215_us_2=$add155_us_2>$add214_us_2;var $conv218_us_2=$cmp215_us_2&1;var $add219_us_2=$gsfb_1168+2|0;var $arrayidx221_us_2=$add219_us_2+($cod_info+5212)|0;HEAP8[$arrayidx221_us_2]=$conv218_us_2;HEAPF32[$incdec_ptr222_us_1>>2]=$cond212_us_2;var $ath_over_3_lcssa=$ath_over_4_us_2;var $j_3_lcssa=$57;label=42;break}}function _calc_noise($cod_info,$l3_xmin,$distort,$res,$prev_noise){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+8|0;label=1;while(1)switch(label){case 1:var $ix01_i=sp;var $over_SSD=$res+16|0;HEAP32[$over_SSD>>2]=0;var $psymax=$cod_info+4864|0;var $0=HEAP32[$psymax>>2];var $cmp70=($0|0)>0;if($cmp70){label=2;break}else{var $over_noise_db_0_lcssa=0;var $tot_noise_db_0_lcssa=0;var $max_noise_0_lcssa=-20;var $over_0_lcssa=0;label=30;break};case 2:var $arraydecay=$cod_info+4608|0;var $global_gain=$cod_info+4780|0;var $preflag=$cod_info+4832|0;var $scalefac_scale=$cod_info+4836|0;var $tobool7=($prev_noise|0)!=0;var $global_gain60=$prev_noise|0;var $max_nonzero_coeff=$cod_info+5208|0;var $1=$ix01_i;var $count1_i=$cod_info+4776|0;var $big_values_i=$cod_info+4772|0;var $arrayidx8_i=$ix01_i|0;var $arrayidx9_i=$ix01_i+4|0;var $2=0;var $over_noise_db_071=0;var $tot_noise_db_072=0;var $max_noise_073=-20;var $scalefac_074=$arraydecay;var $over_075=0;var $sfb_076=0;var $distort_addr_079=$distort;var $l3_xmin_addr_080=$l3_xmin;label=3;break;case 3:var $l3_xmin_addr_080;var $distort_addr_079;var $sfb_076;var $over_075;var $scalefac_074;var $max_noise_073;var $tot_noise_db_072;var $over_noise_db_071;var $2;var $3=HEAP32[$global_gain>>2];var $incdec_ptr=$scalefac_074+4|0;var $4=HEAP32[$scalefac_074>>2];var $5=HEAP32[$preflag>>2];var $tobool=($5|0)==0;if($tobool){var $cond=0;label=5;break}else{label=4;break};case 4:var $arrayidx=9640+($sfb_076<<2)|0;var $6=HEAP32[$arrayidx>>2];var $cond=$6;label=5;break;case 5:var $cond;var $add=$cond+$4|0;var $7=HEAP32[$scalefac_scale>>2];var $add2=$7+1|0;var $shl=$add<<$add2;var $sub=$3-$shl|0;var $arrayidx3=$cod_info+5028+($sfb_076<<2)|0;var $8=HEAP32[$arrayidx3>>2];var $arrayidx4=$cod_info+4808+($8<<2)|0;var $9=HEAP32[$arrayidx4>>2];var $mul=$9<<3;var $sub5=$sub-$mul|0;var $incdec_ptr6=$l3_xmin_addr_080+4|0;var $10=HEAPF32[$l3_xmin_addr_080>>2];var $div=1/$10;if($tobool7){label=6;break}else{label=8;break};case 6:var $arrayidx8=$prev_noise+8+($sfb_076<<2)|0;var $11=HEAP32[$arrayidx8>>2];var $cmp9=($11|0)==($sub5|0);if($cmp9){label=7;break}else{label=8;break};case 7:var $arrayidx10=$cod_info+4872+($sfb_076<<2)|0;var $12=HEAP32[$arrayidx10>>2];var $add11=$12+$2|0;var $arrayidx13=$prev_noise+164+($sfb_076<<2)|0;var $13=HEAPF32[$arrayidx13>>2];var $mul14=$div*$13;var $arrayidx15=$prev_noise+320+($sfb_076<<2)|0;var $14=HEAPF32[$arrayidx15>>2];var $noise_0_ph=$14;var $distort__0_ph=$mul14;var $_ph=$add11;label=26;break;case 8:var $add17=$sub5+116|0;var $arrayidx18=61640+($add17<<2)|0;var $15=HEAPF32[$arrayidx18>>2];var $arrayidx20=$cod_info+4872+($sfb_076<<2)|0;var $16=HEAP32[$arrayidx20>>2];var $shr=$16>>1;var $add23=$16+$2|0;var $17=HEAP32[$max_nonzero_coeff>>2];var $cmp24=($add23|0)>($17|0);if($cmp24){label=9;break}else{var $l_0=$shr;label=10;break};case 9:var $sub27=$17-$2|0;var $add28=$sub27+1|0;var $cmp29=($add28|0)>0;var $shr31=$add28>>1;var $shr31_=$cmp29?$shr31:0;var $l_0=$shr31_;label=10;break;case 10:var $l_0;var $18=HEAP32[$count1_i>>2];var $cmp_i=($2|0)>($18|0);if($cmp_i){label=11;break}else{label=13;break};case 11:var $tobool53_i=($l_0|0)==0;if($tobool53_i){var $noise_3_i=0;var $j_3_i=$2;label=21;break}else{var $j_054_i=$2;var $noise_055_i=0;var $l_addr_056_i=$l_0;label=12;break};case 12:var $l_addr_056_i;var $noise_055_i;var $j_054_i;var $dec_i=$l_addr_056_i-1|0;var $arrayidx_i=$cod_info+($j_054_i<<2)|0;var $19=HEAPF32[$arrayidx_i>>2];var $inc_i=$j_054_i+1|0;var $mul_i=$19*$19;var $add_i=$noise_055_i+$mul_i;var $arrayidx2_i=$cod_info+($inc_i<<2)|0;var $20=HEAPF32[$arrayidx2_i>>2];var $inc3_i=$j_054_i+2|0;var $mul4_i=$20*$20;var $add5_i=$add_i+$mul4_i;var $tobool_i=($dec_i|0)==0;if($tobool_i){label=18;break}else{var $j_054_i=$inc3_i;var $noise_055_i=$add5_i;var $l_addr_056_i=$dec_i;label=12;break};case 13:var $21=HEAP32[$big_values_i>>2];var $cmp6_i=($2|0)>($21|0);if($cmp6_i){label=15;break}else{label=14;break};case 14:var $tobool4066_i=($l_0|0)==0;if($tobool4066_i){var $noise_3_i=0;var $j_3_i=$2;label=21;break}else{var $j_267_i=$2;var $noise_268_i=0;var $l_addr_269_i=$l_0;label=17;break};case 15:HEAPF32[$arrayidx8_i>>2]=0;HEAPF32[$arrayidx9_i>>2]=$15;var $tobool1259_i=($l_0|0)==0;if($tobool1259_i){var $noise_3_i=0;var $j_3_i=$2;label=21;break}else{var $j_160_i=$2;var $noise_161_i=0;var $l_addr_162_i=$l_0;label=16;break};case 16:var $l_addr_162_i;var $noise_161_i;var $j_160_i;var $dec11_i=$l_addr_162_i-1|0;var $arrayidx16_i=$cod_info+($j_160_i<<2)|0;var $22=HEAPF32[$arrayidx16_i>>2];var $fabsf_i=Math.abs($22);var $arrayidx17_i=$cod_info+2304+($j_160_i<<2)|0;var $23=HEAP32[$arrayidx17_i>>2];var $arrayidx18_i=$ix01_i+($23<<2)|0;var $24=HEAPF32[$arrayidx18_i>>2];var $conv20_i=$fabsf_i-$24;var $inc21_i=$j_160_i+1|0;var $mul22_i=$conv20_i*$conv20_i;var $add23_i=$noise_161_i+$mul22_i;var $arrayidx25_i=$cod_info+($inc21_i<<2)|0;var $25=HEAPF32[$arrayidx25_i>>2];var $fabsf50_i=Math.abs($25);var $arrayidx28_i=$cod_info+2304+($inc21_i<<2)|0;var $26=HEAP32[$arrayidx28_i>>2];var $arrayidx29_i=$ix01_i+($26<<2)|0;var $27=HEAPF32[$arrayidx29_i>>2];var $conv32_i=$fabsf50_i-$27;var $inc33_i=$j_160_i+2|0;var $mul34_i=$conv32_i*$conv32_i;var $add35_i=$add23_i+$mul34_i;var $tobool12_i=($dec11_i|0)==0;if($tobool12_i){label=19;break}else{var $j_160_i=$inc33_i;var $noise_161_i=$add35_i;var $l_addr_162_i=$dec11_i;label=16;break};case 17:var $l_addr_269_i;var $noise_268_i;var $j_267_i;var $dec39_i=$l_addr_269_i-1|0;var $arrayidx44_i=$cod_info+($j_267_i<<2)|0;var $28=HEAPF32[$arrayidx44_i>>2];var $fabsf51_i=Math.abs($28);var $arrayidx47_i=$cod_info+2304+($j_267_i<<2)|0;var $29=HEAP32[$arrayidx47_i>>2];var $arrayidx48_i=28808+($29<<2)|0;var $30=HEAPF32[$arrayidx48_i>>2];var $mul49_i=$15*$30;var $conv52_i=$fabsf51_i-$mul49_i;var $inc53_i=$j_267_i+1|0;var $mul54_i=$conv52_i*$conv52_i;var $add55_i=$noise_268_i+$mul54_i;var $arrayidx57_i=$cod_info+($inc53_i<<2)|0;var $31=HEAPF32[$arrayidx57_i>>2];var $fabsf52_i=Math.abs($31);var $arrayidx60_i=$cod_info+2304+($inc53_i<<2)|0;var $32=HEAP32[$arrayidx60_i>>2];var $arrayidx61_i=28808+($32<<2)|0;var $33=HEAPF32[$arrayidx61_i>>2];var $mul62_i=$15*$33;var $conv65_i=$fabsf52_i-$mul62_i;var $inc66_i=$j_267_i+2|0;var $mul67_i=$conv65_i*$conv65_i;var $add68_i=$add55_i+$mul67_i;var $tobool40_i=($dec39_i|0)==0;if($tobool40_i){label=20;break}else{var $j_267_i=$inc66_i;var $noise_268_i=$add68_i;var $l_addr_269_i=$dec39_i;label=17;break};case 18:var $34=$l_0<<1;var $35=$34+$2|0;var $noise_3_i=$add5_i;var $j_3_i=$35;label=21;break;case 19:var $36=$l_0<<1;var $37=$36+$2|0;var $noise_3_i=$add35_i;var $j_3_i=$37;label=21;break;case 20:var $38=$l_0<<1;var $39=$38+$2|0;var $noise_3_i=$add68_i;var $j_3_i=$39;label=21;break;case 21:var $j_3_i;var $noise_3_i;if($tobool7){label=22;break}else{label=23;break};case 22:var $arrayidx37=$prev_noise+8+($sfb_076<<2)|0;HEAP32[$arrayidx37>>2]=$sub5;var $arrayidx39=$prev_noise+164+($sfb_076<<2)|0;HEAPF32[$arrayidx39>>2]=$noise_3_i;label=23;break;case 23:var $mul41=$div*$noise_3_i;var $cmp42=$mul41>9.999999682655225e-21;var $cond46=$cmp42?$mul41:9.999999682655225e-21;var $call47=_fast_log2($cond46);var $conv=$call47;var $mul48=$conv*.30102999566398114;var $conv49=$mul48;if($tobool7){label=24;break}else{label=25;break};case 24:var $arrayidx53=$prev_noise+320+($sfb_076<<2)|0;HEAPF32[$arrayidx53>>2]=$conv49;var $noise_0_ph=$conv49;var $distort__0_ph=$mul41;var $_ph=$j_3_i;label=26;break;case 25:HEAPF32[$distort_addr_079>>2]=$mul41;var $41=$j_3_i;var $noise_066=$conv49;label=27;break;case 26:var $_ph;var $distort__0_ph;var $noise_0_ph;HEAPF32[$distort_addr_079>>2]=$distort__0_ph;var $40=HEAP32[$global_gain>>2];HEAP32[$global_gain60>>2]=$40;var $41=$_ph;var $noise_066=$noise_0_ph;label=27;break;case 27:var $noise_066;var $41;var $incdec_ptr5668=$distort_addr_079+4|0;var $add62=$tot_noise_db_072+$noise_066;var $cmp64=$noise_066>0;if($cmp64){label=28;break}else{var $over_1=$over_075;var $over_noise_db_1=$over_noise_db_071;label=29;break};case 28:var $mul67=$noise_066*10;var $conv68=$mul67;var $add69=$conv68+.5;var $conv70=$add69&-1;var $cmp71=($conv70|0)>1;var $conv70_=$cmp71?$conv70:1;var $mul81=Math.imul($conv70_,$conv70_)|0;var $42=HEAP32[$over_SSD>>2];var $add83=$42+$mul81|0;HEAP32[$over_SSD>>2]=$add83;var $inc=$over_075+1|0;var $add84=$over_noise_db_071+$noise_066;var $over_1=$inc;var $over_noise_db_1=$add84;label=29;break;case 29:var $over_noise_db_1;var $over_1;var $cmp86=$max_noise_073>$noise_066;var $cond91=$cmp86?$max_noise_073:$noise_066;var $inc92=$sfb_076+1|0;var $43=HEAP32[$psymax>>2];var $cmp=($inc92|0)<($43|0);if($cmp){var $2=$41;var $over_noise_db_071=$over_noise_db_1;var $tot_noise_db_072=$add62;var $max_noise_073=$cond91;var $scalefac_074=$incdec_ptr;var $over_075=$over_1;var $sfb_076=$inc92;var $distort_addr_079=$incdec_ptr5668;var $l3_xmin_addr_080=$incdec_ptr6;label=3;break}else{var $over_noise_db_0_lcssa=$over_noise_db_1;var $tot_noise_db_0_lcssa=$add62;var $max_noise_0_lcssa=$cond91;var $over_0_lcssa=$over_1;label=30;break};case 30:var $over_0_lcssa;var $max_noise_0_lcssa;var $tot_noise_db_0_lcssa;var $over_noise_db_0_lcssa;var $over_count=$res+12|0;HEAP32[$over_count>>2]=$over_0_lcssa;var $tot_noise=$res+4|0;HEAPF32[$tot_noise>>2]=$tot_noise_db_0_lcssa;var $over_noise=$res|0;HEAPF32[$over_noise>>2]=$over_noise_db_0_lcssa;var $max_noise93=$res+8|0;HEAPF32[$max_noise93>>2]=$max_noise_0_lcssa;STACKTOP=sp;return $over_0_lcssa}}function _set_frame_pinfo($gfc,$ratio){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+504|0;label=1;while(1)switch(label){case 1:var $l3_xmin_i=sp;var $xfsf_i=sp+160;var $noise_i=sp+320;var $scalefac_sav=sp+344;var $mode_gr=$gfc+76|0;var $0=HEAP32[$mode_gr>>2];var $cmp30=($0|0)>0;if($cmp30){label=2;break}else{label=43;break};case 2:var $channels_out=$gfc+72|0;var $1=$scalefac_sav;var $2=$l3_xmin_i;var $3=$xfsf_i;var $4=$noise_i;var $arraydecay3_i=$l3_xmin_i|0;var $arraydecay5_i=$xfsf_i|0;var $pinfo_i=$gfc+85804|0;var $ATHonly_i=$gfc+212|0;var $ATH_i=$gfc+85796|0;var $ATHshort_i=$gfc+216|0;var $over_count_i=$noise_i+12|0;var $max_noise_i=$noise_i+8|0;var $over_noise_i=$noise_i|0;var $tot_noise_i=$noise_i+4|0;var $over_SSD_i=$noise_i+16|0;var $_pre=HEAP32[$channels_out>>2];var $gr_031=0;var $6=$_pre;var $5=$0;label=3;break;case 3:var $5;var $6;var $gr_031;var $cmp326=($6|0)>0;if($cmp326){label=4;break}else{var $79=$6;var $78=$5;label=42;break};case 4:var $cmp6=($gr_031|0)==1;var $ch_027=0;label=5;break;case 5:var $ch_027;var $arrayidx5=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)|0;var $scalefac=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4608|0;var $7=$scalefac;_memcpy($1,$7,156)|0;if($cmp6){label=6;break}else{label=10;break};case 6:var $sfb_lmax=$gfc+10808+($ch_027*5252&-1)+4848|0;var $8=HEAP32[$sfb_lmax>>2];var $cmp824=($8|0)>0;if($cmp824){var $sfb_025=0;var $9=$8;label=7;break}else{label=10;break};case 7:var $9;var $sfb_025;var $arrayidx11=$gfc+10808+($ch_027*5252&-1)+4608+($sfb_025<<2)|0;var $10=HEAP32[$arrayidx11>>2];var $cmp12=($10|0)<0;if($cmp12){label=8;break}else{var $12=$9;label=9;break};case 8:var $arrayidx19=$gfc+304+($ch_027*5252&-1)+4608+($sfb_025<<2)|0;var $11=HEAP32[$arrayidx19>>2];HEAP32[$arrayidx11>>2]=$11;var $_pre34=HEAP32[$sfb_lmax>>2];var $12=$_pre34;label=9;break;case 9:var $12;var $inc=$sfb_025+1|0;var $cmp8=($inc|0)<($12|0);if($cmp8){var $sfb_025=$inc;var $9=$12;label=7;break}else{label=10;break};case 10:var $arrayidx24=$ratio+($gr_031*976&-1)+($ch_027*488&-1)|0;var $scalefac_scale_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4836|0;var $13=HEAP32[$scalefac_scale_i>>2];var $cmp_i=($13|0)==0;var $conv_i=$cmp_i?.5:1;var $call_i=_calc_xmin($gfc,$arrayidx24,$arrayidx5,$arraydecay3_i);var $call6_i=_calc_noise($arrayidx5,$arraydecay3_i,$arraydecay5_i,$noise_i,0);var $sfb_lmax_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4848|0;var $14=HEAP32[$sfb_lmax_i>>2];var $block_type_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4788|0;var $15=HEAP32[$block_type_i>>2];var $cmp7_i=($15|0)==2;if($cmp7_i){var $sfb2_0_i=$14;label=12;break}else{label=11;break};case 11:var $mixed_block_flag_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4792|0;var $16=HEAP32[$mixed_block_flag_i>>2];var $tobool_i=($16|0)==0;var $__i=$tobool_i?22:$14;var $sfb2_0_i=$__i;label=12;break;case 12:var $sfb2_0_i;var $cmp9199_i=($sfb2_0_i|0)>0;if($cmp9199_i){label=13;break}else{var $j_0_lcssa_i=0;var $sfb_0_lcssa_i=0;var $37=$15;label=25;break};case 13:var $preflag_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4832|0;var $sub84_i=-$conv_i;var $j_0200_i=0;var $sfb_0201_i=0;label=14;break;case 14:var $sfb_0201_i;var $j_0200_i;var $arrayidx_i=$gfc+21360+($sfb_0201_i<<2)|0;var $17=HEAP32[$arrayidx_i>>2];var $add_i=$sfb_0201_i+1|0;var $arrayidx14_i=$gfc+21360+($add_i<<2)|0;var $18=HEAP32[$arrayidx14_i>>2];var $sub_i=$18-$17|0;var $cmp16194_i=($j_0200_i|0)<($18|0);if($cmp16194_i){var $j_1195_i=$j_0200_i;var $en0_0196_i=0;label=15;break}else{var $j_1_lcssa_i=$j_0200_i;var $en0_0_lcssa_i=0;label=16;break};case 15:var $en0_0196_i;var $j_1195_i;var $arrayidx19_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+($j_1195_i<<2)|0;var $19=HEAPF32[$arrayidx19_i>>2];var $mul_i=$19*$19;var $add22_i=$en0_0196_i+$mul_i;var $inc_i=$j_1195_i+1|0;var $cmp16_i=($inc_i|0)<($18|0);if($cmp16_i){var $j_1195_i=$inc_i;var $en0_0196_i=$add22_i;label=15;break}else{var $j_1_lcssa_i=$18;var $en0_0_lcssa_i=$add22_i;label=16;break};case 16:var $en0_0_lcssa_i;var $j_1_lcssa_i;var $conv23_i=$sub_i|0;var $div_i=$en0_0_lcssa_i/$conv23_i;var $mul24_i=$div_i*999999986991104;var $conv25_i=$mul24_i;var $20=HEAP32[$pinfo_i>>2];var $arrayidx28_i=$20+190712+($gr_031*704&-1)+($ch_027*176&-1)+($sfb_0201_i<<3)|0;HEAPF64[$arrayidx28_i>>3]=$conv25_i;var $arrayidx29_i=$l3_xmin_i+($sfb_0201_i<<2)|0;var $21=HEAPF32[$arrayidx29_i>>2];var $mul30_i=$21*999999986991104;var $arrayidx31_i=$xfsf_i+($sfb_0201_i<<2)|0;var $22=HEAPF32[$arrayidx31_i>>2];var $mul32_i=$mul30_i*$22;var $div34_i=$mul32_i/$conv23_i;var $conv35_i=$div34_i;var $23=HEAP32[$pinfo_i>>2];var $arrayidx40_i=$23+201208+($gr_031*352&-1)+($ch_027*176&-1)+($sfb_0201_i<<3)|0;HEAPF64[$arrayidx40_i>>3]=$conv35_i;var $arrayidx43_i=$ratio+($gr_031*976&-1)+($ch_027*488&-1)+244+($sfb_0201_i<<2)|0;var $24=HEAPF32[$arrayidx43_i>>2];var $cmp44_i=$24>0;if($cmp44_i){label=17;break}else{var $en0_1_i=0;label=19;break};case 17:var $25=HEAP32[$ATHonly_i>>2];var $tobool47_i=($25|0)==0;if($tobool47_i){label=18;break}else{var $en0_1_i=0;label=19;break};case 18:var $div52_i=$div_i/$24;var $en0_1_i=$div52_i;label=19;break;case 19:var $en0_1_i;var $arrayidx55_i=$ratio+($gr_031*976&-1)+($ch_027*488&-1)+($sfb_0201_i<<2)|0;var $26=HEAPF32[$arrayidx55_i>>2];var $mul56_i=$en0_1_i*$26;var $27=HEAP32[$ATH_i>>2];var $arrayidx58_i=$27+24+($sfb_0201_i<<2)|0;var $28=HEAPF32[$arrayidx58_i>>2];var $cmp59_i=$mul56_i>$28;var $mul56__i=$cmp59_i?$mul56_i:$28;var $mul69_i=$mul56__i*999999986991104;var $conv70_i=$mul69_i;var $29=HEAP32[$pinfo_i>>2];var $arrayidx74_i=$29+189304+($gr_031*704&-1)+($ch_027*176&-1)+($sfb_0201_i<<3)|0;HEAPF64[$arrayidx74_i>>3]=$conv70_i;var $30=HEAP32[$pinfo_i>>2];var $arrayidx78_i=$30+199160+($gr_031*352&-1)+($ch_027*176&-1)+($sfb_0201_i<<3)|0;HEAPF64[$arrayidx78_i>>3]=0;var $31=HEAP32[$preflag_i>>2];var $tobool79_i=($31|0)!=0;var $cmp81_i=($sfb_0201_i|0)>10;var $or_cond_i=$tobool79_i&$cmp81_i;if($or_cond_i){label=20;break}else{label=21;break};case 20:var $arrayidx85_i=9640+($sfb_0201_i<<2)|0;var $32=HEAP32[$arrayidx85_i>>2];var $conv86_i=$32|0;var $mul87_i=$conv86_i*$sub84_i;var $conv88_i=$mul87_i;var $33=HEAP32[$pinfo_i>>2];var $arrayidx93_i=$33+199160+($gr_031*352&-1)+($ch_027*176&-1)+($sfb_0201_i<<3)|0;HEAPF64[$arrayidx93_i>>3]=$conv88_i;label=21;break;case 21:var $cmp95_i=($sfb_0201_i|0)<21;if($cmp95_i){label=23;break}else{label=22;break};case 22:var $cmp9_i=($add_i|0)<($sfb2_0_i|0);if($cmp9_i){var $j_0200_i=$j_1_lcssa_i;var $sfb_0201_i=$add_i;label=14;break}else{label=24;break};case 23:var $arrayidx98_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4608+($sfb_0201_i<<2)|0;var $34=HEAP32[$arrayidx98_i>>2];var $conv99_i=$34|0;var $mul100_i=$conv_i*$conv99_i;var $conv101_i=$mul100_i;var $35=HEAP32[$pinfo_i>>2];var $arrayidx106_i=$35+199160+($gr_031*352&-1)+($ch_027*176&-1)+($sfb_0201_i<<3)|0;var $36=HEAPF64[$arrayidx106_i>>3];var $sub107_i=$36-$conv101_i;HEAPF64[$arrayidx106_i>>3]=$sub107_i;label=22;break;case 24:var $_pre_i=HEAP32[$block_type_i>>2];var $j_0_lcssa_i=$j_1_lcssa_i;var $sfb_0_lcssa_i=$sfb2_0_i;var $37=$_pre_i;label=25;break;case 25:var $37;var $sfb_0_lcssa_i;var $j_0_lcssa_i;var $cmp113_i=($37|0)==2;if($cmp113_i){label=26;break}else{label=40;break};case 26:var $sfb_smin_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4852|0;var $38=HEAP32[$sfb_smin_i>>2];var $cmp117190_i=($38|0)<13;if($cmp117190_i){var $j_2191_i=$j_0_lcssa_i;var $sfb2_1192_i=$sfb_0_lcssa_i;var $sfb_1193_i=$38;label=28;break}else{label=40;break};case 27:var $39=$sfb2_1192_i+3|0;var $cmp117_i=($add122_i|0)<13;if($cmp117_i){var $j_2191_i=$j_4_lcssa_i;var $sfb2_1192_i=$39;var $sfb_1193_i=$add122_i;label=28;break}else{label=40;break};case 28:var $sfb_1193_i;var $sfb2_1192_i;var $j_2191_i;var $arrayidx121_i=$gfc+21452+($sfb_1193_i<<2)|0;var $40=HEAP32[$arrayidx121_i>>2];var $add122_i=$sfb_1193_i+1|0;var $arrayidx125_i=$gfc+21452+($add122_i<<2)|0;var $41=HEAP32[$arrayidx125_i>>2];var $sub126_i=$41-$40|0;var $cmp132182_i=($40|0)<($41|0);var $conv145_i=$sub126_i|0;var $mul160_i=$sfb_1193_i*3&-1;var $cmp237_i=($sfb_1193_i|0)<12;var $j_3187_i=$j_2191_i;var $i_0188_i=0;var $sfb2_2189_i=$sfb2_1192_i;label=29;break;case 29:var $sfb2_2189_i;var $i_0188_i;var $j_3187_i;if($cmp132182_i){var $j_4183_i=$j_3187_i;var $l_0184_i=$40;var $en0_2185_i=0;label=30;break}else{var $j_4_lcssa_i=$j_3187_i;var $en0_2_lcssa_i=0;label=32;break};case 30:var $en0_2185_i;var $l_0184_i;var $j_4183_i;var $arrayidx136_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+($j_4183_i<<2)|0;var $42=HEAPF32[$arrayidx136_i>>2];var $mul139_i=$42*$42;var $add140_i=$en0_2185_i+$mul139_i;var $inc141_i=$j_4183_i+1|0;var $inc143_i=$l_0184_i+1|0;var $cmp132_i=($inc143_i|0)<($41|0);if($cmp132_i){var $j_4183_i=$inc141_i;var $l_0184_i=$inc143_i;var $en0_2185_i=$add140_i;label=30;break}else{label=31;break};case 31:var $43=$j_3187_i+$sub126_i|0;var $j_4_lcssa_i=$43;var $en0_2_lcssa_i=$add140_i;label=32;break;case 32:var $en0_2_lcssa_i;var $j_4_lcssa_i;var $div146_i=$en0_2_lcssa_i/$conv145_i;var $conv147_i=$div146_i;var $cmp148_i=$conv147_i>1e-20;var $cond156_i=$cmp148_i?$div146_i:9.999999682655225e-21;var $mul158_i=$cond156_i*999999986991104;var $conv159_i=$mul158_i;var $add161_i=$i_0188_i+$mul160_i|0;var $44=HEAP32[$pinfo_i>>2];var $arrayidx165_i=$44+194616+($gr_031*1248&-1)+($ch_027*312&-1)+($add161_i<<3)|0;HEAPF64[$arrayidx165_i>>3]=$conv159_i;var $arrayidx166_i=$l3_xmin_i+($sfb2_2189_i<<2)|0;var $45=HEAPF32[$arrayidx166_i>>2];var $mul167_i=$45*999999986991104;var $arrayidx168_i=$xfsf_i+($sfb2_2189_i<<2)|0;var $46=HEAPF32[$arrayidx168_i>>2];var $mul169_i=$mul167_i*$46;var $div171_i=$mul169_i/$conv145_i;var $conv172_i=$div171_i;var $47=HEAP32[$pinfo_i>>2];var $arrayidx178_i=$47+201912+($gr_031*624&-1)+($ch_027*312&-1)+($add161_i<<3)|0;HEAPF64[$arrayidx178_i>>3]=$conv172_i;var $arrayidx182_i=$ratio+($gr_031*976&-1)+($ch_027*488&-1)+332+($sfb_1193_i*12&-1)+($i_0188_i<<2)|0;var $48=HEAPF32[$arrayidx182_i>>2];var $cmp183_i=$48>0;if($cmp183_i){label=33;break}else{var $en0_3_i=0;label=34;break};case 33:var $div190_i=$cond156_i/$48;var $en0_3_i=$div190_i;label=34;break;case 34:var $en0_3_i;var $49=HEAP32[$ATHonly_i>>2];var $tobool194_i=($49|0)==0;if($tobool194_i){label=35;break}else{label=36;break};case 35:var $50=HEAP32[$ATHshort_i>>2];var $tobool195_i=($50|0)==0;if($tobool195_i){var $en0_4_i=$en0_3_i;label=37;break}else{label=36;break};case 36:var $en0_4_i=0;label=37;break;case 37:var $en0_4_i;var $arrayidx201_i=$ratio+($gr_031*976&-1)+($ch_027*488&-1)+88+($sfb_1193_i*12&-1)+($i_0188_i<<2)|0;var $51=HEAPF32[$arrayidx201_i>>2];var $mul202_i=$en0_4_i*$51;var $52=HEAP32[$ATH_i>>2];var $arrayidx205_i=$52+112+($sfb_1193_i<<2)|0;var $53=HEAPF32[$arrayidx205_i>>2];var $cmp206_i=$mul202_i>$53;var $mul202__i=$cmp206_i?$mul202_i:$53;var $mul220_i=$mul202__i*999999986991104;var $conv221_i=$mul220_i;var $54=HEAP32[$pinfo_i>>2];var $arrayidx227_i=$54+192120+($gr_031*1248&-1)+($ch_027*312&-1)+($add161_i<<3)|0;HEAPF64[$arrayidx227_i>>3]=$conv221_i;var $arrayidx228_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4808+($i_0188_i<<2)|0;var $55=HEAP32[$arrayidx228_i>>2];var $conv229_i=$55|0;var $mul230_i=$conv229_i*-2;var $56=HEAP32[$pinfo_i>>2];var $arrayidx236_i=$56+199864+($gr_031*624&-1)+($ch_027*312&-1)+($add161_i<<3)|0;HEAPF64[$arrayidx236_i>>3]=$mul230_i;if($cmp237_i){label=38;break}else{label=39;break};case 38:var $arrayidx240_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4608+($sfb2_2189_i<<2)|0;var $57=HEAP32[$arrayidx240_i>>2];var $conv241_i=$57|0;var $mul242_i=$conv_i*$conv241_i;var $conv243_i=$mul242_i;var $58=HEAP32[$pinfo_i>>2];var $arrayidx250_i=$58+199864+($gr_031*624&-1)+($ch_027*312&-1)+($add161_i<<3)|0;var $59=HEAPF64[$arrayidx250_i>>3];var $sub251_i=$59-$conv243_i;HEAPF64[$arrayidx250_i>>3]=$sub251_i;label=39;break;case 39:var $inc253_i=$sfb2_2189_i+1|0;var $inc255_i=$i_0188_i+1|0;var $cmp128_i=($inc255_i|0)<3;if($cmp128_i){var $j_3187_i=$j_4_lcssa_i;var $i_0188_i=$inc255_i;var $sfb2_2189_i=$inc253_i;label=29;break}else{label=27;break};case 40:var $global_gain_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4780|0;var $60=HEAP32[$global_gain_i>>2];var $61=HEAP32[$pinfo_i>>2];var $arrayidx263_i=$61+201112+($gr_031<<3)+($ch_027<<2)|0;HEAP32[$arrayidx263_i>>2]=$60;var $part2_3_length_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4768|0;var $62=HEAP32[$part2_3_length_i>>2];var $part2_length_i=$gfc+304+($gr_031*10504&-1)+($ch_027*5252&-1)+4844|0;var $63=HEAP32[$part2_length_i>>2];var $add264_i=$63+$62|0;var $64=HEAP32[$pinfo_i>>2];var $arrayidx267_i=$64+203400+($gr_031<<3)+($ch_027<<2)|0;HEAP32[$arrayidx267_i>>2]=$add264_i;var $65=HEAP32[$part2_length_i>>2];var $66=HEAP32[$pinfo_i>>2];var $arrayidx271_i=$66+203416+($gr_031<<3)+($ch_027<<2)|0;HEAP32[$arrayidx271_i>>2]=$65;var $67=HEAP32[$over_count_i>>2];var $68=HEAP32[$pinfo_i>>2];var $arrayidx274_i=$68+203160+($gr_031<<3)+($ch_027<<2)|0;HEAP32[$arrayidx274_i>>2]=$67;var $69=HEAPF32[$max_noise_i>>2];var $conv275_i=$69;var $mul276_i=$conv275_i*10;var $70=HEAP32[$pinfo_i>>2];var $arrayidx280_i=$70+203208+($gr_031<<4)+($ch_027<<3)|0;HEAPF64[$arrayidx280_i>>3]=$mul276_i;var $71=HEAPF32[$over_noise_i>>2];var $conv281_i=$71;var $mul282_i=$conv281_i*10;var $72=HEAP32[$pinfo_i>>2];var $arrayidx286_i=$72+203240+($gr_031<<4)+($ch_027<<3)|0;HEAPF64[$arrayidx286_i>>3]=$mul282_i;var $73=HEAPF32[$tot_noise_i>>2];var $conv287_i=$73;var $mul288_i=$conv287_i*10;var $74=HEAP32[$pinfo_i>>2];var $arrayidx292_i=$74+203176+($gr_031<<4)+($ch_027<<3)|0;HEAPF64[$arrayidx292_i>>3]=$mul288_i;var $75=HEAP32[$over_SSD_i>>2];var $76=HEAP32[$pinfo_i>>2];var $arrayidx296_i=$76+203272+($gr_031<<3)+($ch_027<<2)|0;HEAP32[$arrayidx296_i>>2]=$75;_memcpy($7,$1,156)|0;var $inc27=$ch_027+1|0;var $77=HEAP32[$channels_out>>2];var $cmp3=($inc27|0)<($77|0);if($cmp3){var $ch_027=$inc27;label=5;break}else{label=41;break};case 41:var $_pre33=HEAP32[$mode_gr>>2];var $79=$77;var $78=$_pre33;label=42;break;case 42:var $78;var $79;var $inc30=$gr_031+1|0;var $cmp=($inc30|0)<($78|0);if($cmp){var $gr_031=$inc30;var $6=$79;var $5=$78;label=3;break}else{label=43;break};case 43:STACKTOP=sp;return}}function _ResvFrameBegin($gfc,$mean_bits){var label=0;label=1;while(1)switch(label){case 1:var $call=_getframebits($gfc);var $sideinfo_len=$gfc+24|0;var $0=HEAP32[$sideinfo_len>>2];var $mul=$0<<3;var $sub=$call-$mul|0;var $mode_gr=$gfc+76|0;var $1=HEAP32[$mode_gr>>2];var $div=($sub|0)/($1|0)&-1;var $mul4=$1<<11;var $sub5=$mul4-8|0;var $buffer_constraint=$gfc+148|0;var $2=HEAP32[$buffer_constraint>>2];var $sub6=$2-$call|0;var $ResvMax=$gfc+52144|0;var $cmp=($sub6|0)>($sub5|0);var $sub5_sub6=$cmp?$sub5:$sub6;HEAP32[$ResvMax>>2]=$sub5_sub6;var $cmp10=($sub5_sub6|0)<0;if($cmp10){label=3;break}else{label=2;break};case 2:var $disable_reservoir=$gfc+144|0;var $3=HEAP32[$disable_reservoir>>2];var $tobool=($3|0)==0;if($tobool){var $4=$sub5_sub6;label=4;break}else{label=3;break};case 3:HEAP32[$ResvMax>>2]=0;var $4=0;label=4;break;case 4:var $4;var $mul15=Math.imul($1,$div)|0;var $ResvSize=$gfc+52140|0;var $5=HEAP32[$ResvSize>>2];var $cmp17=($5|0)<($4|0);var $_=$cmp17?$5:$4;var $add=$_+$mul15|0;var $cmp20=($add|0)>($2|0);var $fullFrameBits_0=$cmp20?$2:$add;var $resvDrain_pre=$gfc+21320|0;HEAP32[$resvDrain_pre>>2]=0;var $pinfo=$gfc+85804|0;var $6=HEAP32[$pinfo>>2];var $cmp23=($6|0)==0;if($cmp23){label=6;break}else{label=5;break};case 5:var $div25=($div|0)/2&-1;var $mean_bits27=$6+203484|0;HEAP32[$mean_bits27>>2]=$div25;var $7=HEAP32[$ResvSize>>2];var $8=HEAP32[$pinfo>>2];var $resvsize=$8+203488|0;HEAP32[$resvsize>>2]=$7;label=6;break;case 6:HEAP32[$mean_bits>>2]=$div;return $fullFrameBits_0}}function _ResvMaxBits($gfc,$mean_bits,$targ_bits,$extra_bits,$cbr){var label=0;label=1;while(1)switch(label){case 1:var $ResvSize2=$gfc+52140|0;var $0=HEAP32[$ResvSize2>>2];var $ResvMax3=$gfc+52144|0;var $1=HEAP32[$ResvMax3>>2];var $tobool=($cbr|0)==0;var $add=$tobool?0:$mean_bits;var $ResvSize_0=$0+$add|0;var $substep_shaping=$gfc+85096|0;var $2=HEAP32[$substep_shaping>>2];var $and=$2&1;var $tobool4=($and|0)==0;if($tobool4){var $ResvMax_0=$1;label=3;break}else{label=2;break};case 2:var $conv=$1|0;var $mul=$conv*.9;var $conv6=$mul&-1;var $ResvMax_0=$conv6;label=3;break;case 3:var $ResvMax_0;var $mul8=$ResvSize_0*10&-1;var $mul9=$ResvMax_0*9&-1;var $cmp=($mul8|0)>($mul9|0);if($cmp){label=4;break}else{label=5;break};case 4:var $div=($mul9|0)/10&-1;var $sub=$ResvSize_0-$div|0;var $add13=$sub+$mean_bits|0;var $or=$2|128;HEAP32[$substep_shaping>>2]=$or;var $targBits_0=$add13;var $add_bits_0=$sub;label=7;break;case 5:var $and18=$2&127;HEAP32[$substep_shaping>>2]=$and18;var $disable_reservoir=$gfc+144|0;var $3=HEAP32[$disable_reservoir>>2];var $tobool19_not=($3|0)!=0;var $tobool4_not=$tobool4^1;var $brmerge=$tobool19_not|$tobool4_not;if($brmerge){var $targBits_0=$mean_bits;var $add_bits_0=0;label=7;break}else{label=6;break};case 6:var $conv25=$mean_bits|0;var $mul26=$conv25*.1;var $sub28=$conv25-$mul26;var $conv29=$sub28&-1;var $targBits_0=$conv29;var $add_bits_0=0;label=7;break;case 7:var $add_bits_0;var $targBits_0;var $mul33=$1*6&-1;var $div34=($mul33|0)/10&-1;var $cmp35=($ResvSize_0|0)<($div34|0);var $ResvSize_0_div34=$cmp35?$ResvSize_0:$div34;var $sub40=$ResvSize_0_div34-$add_bits_0|0;var $cmp41=($sub40|0)<0;var $extraBits_0=$cmp41?0:$sub40;HEAP32[$targ_bits>>2]=$targBits_0;HEAP32[$extra_bits>>2]=$extraBits_0;return}}function _ResvAdjust($gfc,$gi){var $ResvSize=$gfc+52140|0;HEAP32[$ResvSize>>2]=HEAP32[$ResvSize>>2]-(HEAP32[$gi+4844>>2]+HEAP32[$gi+4768>>2]);return}function _ResvFrameEnd($gfc,$mean_bits){var $mul=Math.imul(HEAP32[$gfc+76>>2],$mean_bits)|0;var $ResvSize=$gfc+52140|0;var $add=HEAP32[$ResvSize>>2]+$mul|0;var $rem=($add|0)%8&-1;var $sub6=$add-$rem-HEAP32[$gfc+52144>>2]|0;var $stuffingBits_1=(($sub6|0)>0?$sub6:0)+$rem|0;var $main_data_begin=$gfc+21312|0;var $3=HEAP32[$main_data_begin>>2];var $mul11=$3<<3;var $div=((($mul11|0)<($stuffingBits_1|0)?$mul11:$stuffingBits_1)|0)/8&-1;var $mul15=$div<<3;HEAP32[$gfc+21320>>2]=$mul15;var $sub19=$stuffingBits_1-$mul15|0;HEAP32[$main_data_begin>>2]=$3-$div;HEAP32[$gfc+21324>>2]=$sub19;HEAP32[$ResvSize>>2]=$add-$mul15-$sub19;return}function _lame_set_num_samples($gfp,$num_samples){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $num_samples1=$gfp+4|0;HEAP32[$num_samples1>>2]=$num_samples;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_num_samples($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $num_samples=$gfp+4|0;var $0=HEAP32[$num_samples>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_in_samplerate($gfp,$in_samplerate){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $samplerate_in=$gfp+12|0;HEAP32[$samplerate_in>>2]=$in_samplerate;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_in_samplerate($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $samplerate_in=$gfp+12|0;var $0=HEAP32[$samplerate_in>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_num_channels($gfp,$num_channels){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=4;break}else{label=2;break};case 2:var $cmp=($num_channels|0)>2;var $cmp1=($num_channels|0)==0;var $or_cond=$cmp|$cmp1;if($or_cond){var $retval_0=-1;label=4;break}else{label=3;break};case 3:var $num_channels3=$gfp+8|0;HEAP32[$num_channels3>>2]=$num_channels;var $retval_0=0;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_num_channels($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $num_channels=$gfp+8|0;var $0=HEAP32[$num_channels>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_scale($gfp,$scale){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $scale1=$gfp+20|0;HEAPF32[$scale1>>2]=$scale;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_scale($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $scale=$gfp+20|0;var $0=HEAPF32[$scale>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_scale_left($gfp,$scale){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $scale_left=$gfp+24|0;HEAPF32[$scale_left>>2]=$scale;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_scale_left($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $scale_left=$gfp+24|0;var $0=HEAPF32[$scale_left>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_scale_right($gfp,$scale){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $scale_right=$gfp+28|0;HEAPF32[$scale_right>>2]=$scale;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_scale_right($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $scale_right=$gfp+28|0;var $0=HEAPF32[$scale_right>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_out_samplerate($gfp,$out_samplerate){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $samplerate_out=$gfp+16|0;HEAP32[$samplerate_out>>2]=$out_samplerate;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_out_samplerate($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $samplerate_out=$gfp+16|0;var $0=HEAP32[$samplerate_out>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_analysis($gfp,$analysis){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$analysis>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $analysis3=$gfp+32|0;HEAP32[$analysis3>>2]=$analysis;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_analysis($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $analysis=$gfp+32|0;var $0=HEAP32[$analysis>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_bWriteVbrTag($gfp,$bWriteVbrTag){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$bWriteVbrTag>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $write_lame_tag=$gfp+36|0;HEAP32[$write_lame_tag>>2]=$bWriteVbrTag;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_bWriteVbrTag($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $write_lame_tag=$gfp+36|0;var $0=HEAP32[$write_lame_tag>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_decode_only($gfp,$decode_only){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$decode_only>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $decode_only3=$gfp+40|0;HEAP32[$decode_only3>>2]=$decode_only;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_decode_only($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $decode_only=$gfp+40|0;var $0=HEAP32[$decode_only>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_ogg($gfp,$ogg){return-1}function _lame_get_ogg($gfp){return 0}function _lame_set_quality($gfp,$quality){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=7;break}else{label=2;break};case 2:var $cmp=($quality|0)<0;if($cmp){label=3;break}else{label=4;break};case 3:var $quality2=$gfp+44|0;HEAP32[$quality2>>2]=0;var $retval_0=0;label=7;break;case 4:var $cmp3=($quality|0)>9;var $quality5=$gfp+44|0;if($cmp3){label=5;break}else{label=6;break};case 5:HEAP32[$quality5>>2]=9;var $retval_0=0;label=7;break;case 6:HEAP32[$quality5>>2]=$quality;var $retval_0=0;label=7;break;case 7:var $retval_0;return $retval_0}}function _lame_get_quality($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $quality=$gfp+44|0;var $0=HEAP32[$quality>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_mode($gfp,$mode){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$mode>>>0>4;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $mode3=$gfp+48|0;HEAP32[$mode3>>2]=$mode;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_mode($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=4;label=3;break}else{label=2;break};case 2:var $mode=$gfp+48|0;var $0=HEAP32[$mode>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_mode_automs($gfp,$mode_automs){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$mode_automs>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=4;break}else{label=2;break};case 2:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;if($tobool_i){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $mode3_i=$gfp+48|0;HEAP32[$mode3_i>>2]=1;var $retval_0=0;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_mode_automs($gfp){return 1}function _lame_set_force_ms($gfp,$force_ms){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$force_ms>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $force_ms3=$gfp+52|0;HEAP32[$force_ms3>>2]=$force_ms;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_force_ms($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $force_ms=$gfp+52|0;var $0=HEAP32[$force_ms>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_free_format($gfp,$free_format){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$free_format>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $free_format3=$gfp+56|0;HEAP32[$free_format3>>2]=$free_format;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_free_format($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $free_format=$gfp+56|0;var $0=HEAP32[$free_format>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_findReplayGain($gfp,$findReplayGain){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$findReplayGain>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $findReplayGain3=$gfp+60|0;HEAP32[$findReplayGain3>>2]=$findReplayGain;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_findReplayGain($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $findReplayGain=$gfp+60|0;var $0=HEAP32[$findReplayGain>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_decode_on_the_fly($gfp,$decode_on_the_fly){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$decode_on_the_fly>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $decode_on_the_fly3=$gfp+64|0;HEAP32[$decode_on_the_fly3>>2]=$decode_on_the_fly;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_decode_on_the_fly($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $decode_on_the_fly=$gfp+64|0;var $0=HEAP32[$decode_on_the_fly>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_findPeakSample($gfp,$arg){var label=0;label=1;while(1)switch(label){case 1:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;var $0=$arg>>>0>1;var $or_cond_i=$tobool_i|$0;if($or_cond_i){var $retval_0_i=-1;label=3;break}else{label=2;break};case 2:var $decode_on_the_fly3_i=$gfp+64|0;HEAP32[$decode_on_the_fly3_i>>2]=$arg;var $retval_0_i=0;label=3;break;case 3:var $retval_0_i;return $retval_0_i}}function _lame_get_findPeakSample($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;if($tobool_i){var $retval_0_i=0;label=3;break}else{label=2;break};case 2:var $decode_on_the_fly_i=$gfp+64|0;var $0=HEAP32[$decode_on_the_fly_i>>2];var $retval_0_i=$0;label=3;break;case 3:var $retval_0_i;return $retval_0_i}}function _lame_set_ReplayGain_input($gfp,$arg){var label=0;label=1;while(1)switch(label){case 1:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;var $0=$arg>>>0>1;var $or_cond_i=$tobool_i|$0;if($or_cond_i){var $retval_0_i=-1;label=3;break}else{label=2;break};case 2:var $findReplayGain3_i=$gfp+60|0;HEAP32[$findReplayGain3_i>>2]=$arg;var $retval_0_i=0;label=3;break;case 3:var $retval_0_i;return $retval_0_i}}function _lame_get_ReplayGain_input($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;if($tobool_i){var $retval_0_i=0;label=3;break}else{label=2;break};case 2:var $findReplayGain_i=$gfp+60|0;var $0=HEAP32[$findReplayGain_i>>2];var $retval_0_i=$0;label=3;break;case 3:var $retval_0_i;return $retval_0_i}}function _lame_set_ReplayGain_decode($gfp,$arg){var label=0;label=1;while(1)switch(label){case 1:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;var $0=$arg>>>0>1;var $or_cond_i=$tobool_i|$0;if($or_cond_i){var $retval_0_i7=-1;label=4;break}else{label=2;break};case 2:var $decode_on_the_fly3_i=$gfp+64|0;HEAP32[$decode_on_the_fly3_i>>2]=$arg;var $call_i3=_is_lame_global_flags_valid($gfp);var $tobool_i4=($call_i3|0)==0;if($tobool_i4){var $retval_0_i7=-1;label=4;break}else{label=3;break};case 3:var $findReplayGain3_i=$gfp+60|0;HEAP32[$findReplayGain3_i>>2]=$arg;var $retval_0_i7=0;label=4;break;case 4:var $retval_0_i7;return $retval_0_i7}}function _lame_get_ReplayGain_decode($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;if($tobool_i){label=5;break}else{label=2;break};case 2:var $decode_on_the_fly_i=$gfp+64|0;var $0=HEAP32[$decode_on_the_fly_i>>2];var $cmp=($0|0)>0;if($cmp){label=3;break}else{label=5;break};case 3:var $call_i2=_is_lame_global_flags_valid($gfp);var $tobool_i3=($call_i2|0)==0;if($tobool_i3){label=5;break}else{label=4;break};case 4:var $findReplayGain_i=$gfp+60|0;var $1=HEAP32[$findReplayGain_i>>2];var $cmp2=($1|0)>0;if($cmp2){var $retval_0=1;label=6;break}else{label=5;break};case 5:var $retval_0=0;label=6;break;case 6:var $retval_0;return $retval_0}}function _lame_set_nogap_total($gfp,$the_nogap_total){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $nogap_total=$gfp+72|0;HEAP32[$nogap_total>>2]=$the_nogap_total;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_nogap_total($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $nogap_total=$gfp+72|0;var $0=HEAP32[$nogap_total>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_nogap_currentindex($gfp,$the_nogap_index){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $nogap_current=$gfp+76|0;HEAP32[$nogap_current>>2]=$the_nogap_index;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_nogap_currentindex($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $nogap_current=$gfp+76|0;var $0=HEAP32[$nogap_current>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_errorf($gfp,$func){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $errorf=$gfp+280|0;HEAP32[$errorf>>2]=$func;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_debugf($gfp,$func){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $debugf=$gfp+276|0;HEAP32[$debugf>>2]=$func;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_msgf($gfp,$func){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $msgf=$gfp+272|0;HEAP32[$msgf>>2]=$func;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_brate($gfp,$brate){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=4;break}else{label=2;break};case 2:var $brate1=$gfp+96|0;HEAP32[$brate1>>2]=$brate;var $cmp=($brate|0)>320;if($cmp){label=3;break}else{var $retval_0=0;label=4;break};case 3:var $disable_reservoir=$gfp+128|0;HEAP32[$disable_reservoir>>2]=1;var $retval_0=0;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_brate($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $brate=$gfp+96|0;var $0=HEAP32[$brate>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_compression_ratio($gfp,$compression_ratio){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $compression_ratio1=$gfp+100|0;HEAPF32[$compression_ratio1>>2]=$compression_ratio;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_compression_ratio($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $compression_ratio=$gfp+100|0;var $0=HEAPF32[$compression_ratio>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_copyright($gfp,$copyright){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$copyright>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $copyright3=$gfp+104|0;HEAP32[$copyright3>>2]=$copyright;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_copyright($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $copyright=$gfp+104|0;var $0=HEAP32[$copyright>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_original($gfp,$original){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$original>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $original3=$gfp+108|0;HEAP32[$original3>>2]=$original;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_original($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $original=$gfp+108|0;var $0=HEAP32[$original>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_error_protection($gfp,$error_protection){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$error_protection>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $error_protection3=$gfp+120|0;HEAP32[$error_protection3>>2]=$error_protection;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_error_protection($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $error_protection=$gfp+120|0;var $0=HEAP32[$error_protection>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_padding_type($gfp,$padding_type){return 0}function _lame_get_padding_type($gfp){return 2}function _lame_set_extension($gfp,$extension){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$extension>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $extension3=$gfp+112|0;HEAP32[$extension3>>2]=$extension;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_extension($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $extension=$gfp+112|0;var $0=HEAP32[$extension>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_strict_ISO($gfp,$val){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$val>>>0>2;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $strict_ISO=$gfp+124|0;HEAP32[$strict_ISO>>2]=$val;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_strict_ISO($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $strict_ISO=$gfp+124|0;var $0=HEAP32[$strict_ISO>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_disable_reservoir($gfp,$disable_reservoir){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$disable_reservoir>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $disable_reservoir3=$gfp+128|0;HEAP32[$disable_reservoir3>>2]=$disable_reservoir;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_disable_reservoir($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $disable_reservoir=$gfp+128|0;var $0=HEAP32[$disable_reservoir>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_experimentalX($gfp,$experimentalX){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=6;break}else{label=2;break};case 2:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;if($tobool_i){label=4;break}else{label=3;break};case 3:var $quant_comp_i=$gfp+132|0;HEAP32[$quant_comp_i>>2]=$experimentalX;label=4;break;case 4:var $call_i4=_is_lame_global_flags_valid($gfp);var $tobool_i5=($call_i4|0)==0;if($tobool_i5){var $retval_0=0;label=6;break}else{label=5;break};case 5:var $quant_comp_short_i=$gfp+136|0;HEAP32[$quant_comp_short_i>>2]=$experimentalX;var $retval_0=0;label=6;break;case 6:var $retval_0;return $retval_0}}function _lame_set_quant_comp($gfp,$quant_type){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $quant_comp=$gfp+132|0;HEAP32[$quant_comp>>2]=$quant_type;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_quant_comp_short($gfp,$quant_type){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $quant_comp_short=$gfp+136|0;HEAP32[$quant_comp_short>>2]=$quant_type;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_experimentalX($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;if($tobool_i){var $retval_0_i=0;label=3;break}else{label=2;break};case 2:var $quant_comp_i=$gfp+132|0;var $0=HEAP32[$quant_comp_i>>2];var $retval_0_i=$0;label=3;break;case 3:var $retval_0_i;return $retval_0_i}}function _lame_get_quant_comp($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $quant_comp=$gfp+132|0;var $0=HEAP32[$quant_comp>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_quant_comp_short($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $quant_comp_short=$gfp+136|0;var $0=HEAP32[$quant_comp_short>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_experimentalY($gfp,$experimentalY){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $experimentalY1=$gfp+140|0;HEAP32[$experimentalY1>>2]=$experimentalY;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_experimentalY($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $experimentalY=$gfp+140|0;var $0=HEAP32[$experimentalY>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_experimentalZ($gfp,$experimentalZ){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $experimentalZ1=$gfp+144|0;HEAP32[$experimentalZ1>>2]=$experimentalZ;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_experimentalZ($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $experimentalZ=$gfp+144|0;var $0=HEAP32[$experimentalZ>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_exp_nspsytune($gfp,$exp_nspsytune){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $exp_nspsytune1=$gfp+148|0;HEAP32[$exp_nspsytune1>>2]=$exp_nspsytune;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_exp_nspsytune($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $exp_nspsytune=$gfp+148|0;var $0=HEAP32[$exp_nspsytune>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_VBR($gfp,$VBR){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$VBR>>>0>4;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $VBR3=$gfp+156|0;HEAP32[$VBR3>>2]=$VBR;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_VBR($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $VBR=$gfp+156|0;var $0=HEAP32[$VBR>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_VBR_q($gfp,$VBR_q){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $cmp=($VBR_q|0)<0;var $_VBR_q=$cmp?0:$VBR_q;var $VBR_q_lobit=$VBR_q>>31;var $cmp2=($_VBR_q|0)>9;var $VBR_q_addr_1=$cmp2?9:$_VBR_q;var $ret_1=$cmp2?-1:$VBR_q_lobit;var $VBR_q5=$gfp+164|0;HEAP32[$VBR_q5>>2]=$VBR_q_addr_1;var $VBR_q_frac=$gfp+160|0;HEAPF32[$VBR_q_frac>>2]=0;var $retval_0=$ret_1;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_VBR_q($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $VBR_q=$gfp+164|0;var $0=HEAP32[$VBR_q>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_VBR_quality($gfp,$VBR_q){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $cmp=$VBR_q<0;var $VBR_q_addr_0=$cmp?0:$VBR_q;var $ret_0=$cmp<<31>>31;var $conv=$VBR_q_addr_0;var $cmp2=$conv>9.999;var $VBR_q_addr_1=$cmp2?9.99899959564209:$VBR_q_addr_0;var $ret_1=$cmp2?-1:$ret_0;var $conv6=$VBR_q_addr_1&-1;var $VBR_q7=$gfp+164|0;HEAP32[$VBR_q7>>2]=$conv6;var $conv9=$conv6|0;var $sub=$VBR_q_addr_1-$conv9;var $VBR_q_frac=$gfp+160|0;HEAPF32[$VBR_q_frac>>2]=$sub;var $retval_0=$ret_1;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_VBR_quality($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $VBR_q=$gfp+164|0;var $0=HEAP32[$VBR_q>>2];var $conv=$0|0;var $VBR_q_frac=$gfp+160|0;var $1=HEAPF32[$VBR_q_frac>>2];var $add=$conv+$1;var $retval_0=$add;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_VBR_mean_bitrate_kbps($gfp,$VBR_mean_bitrate_kbps){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $VBR_mean_bitrate_kbps1=$gfp+168|0;HEAP32[$VBR_mean_bitrate_kbps1>>2]=$VBR_mean_bitrate_kbps;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_VBR_mean_bitrate_kbps($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $VBR_mean_bitrate_kbps=$gfp+168|0;var $0=HEAP32[$VBR_mean_bitrate_kbps>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_VBR_min_bitrate_kbps($gfp,$VBR_min_bitrate_kbps){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $VBR_min_bitrate_kbps1=$gfp+172|0;HEAP32[$VBR_min_bitrate_kbps1>>2]=$VBR_min_bitrate_kbps;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_VBR_min_bitrate_kbps($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $VBR_min_bitrate_kbps=$gfp+172|0;var $0=HEAP32[$VBR_min_bitrate_kbps>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_VBR_max_bitrate_kbps($gfp,$VBR_max_bitrate_kbps){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $VBR_max_bitrate_kbps1=$gfp+176|0;HEAP32[$VBR_max_bitrate_kbps1>>2]=$VBR_max_bitrate_kbps;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_VBR_max_bitrate_kbps($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $VBR_max_bitrate_kbps=$gfp+176|0;var $0=HEAP32[$VBR_max_bitrate_kbps>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_VBR_hard_min($gfp,$VBR_hard_min){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$VBR_hard_min>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $VBR_hard_min3=$gfp+180|0;HEAP32[$VBR_hard_min3>>2]=$VBR_hard_min;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_VBR_hard_min($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $VBR_hard_min=$gfp+180|0;var $0=HEAP32[$VBR_hard_min>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_lowpassfreq($gfp,$lowpassfreq){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $lowpassfreq1=$gfp+184|0;HEAP32[$lowpassfreq1>>2]=$lowpassfreq;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_lowpassfreq($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $lowpassfreq=$gfp+184|0;var $0=HEAP32[$lowpassfreq>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_lowpasswidth($gfp,$lowpasswidth){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $lowpasswidth1=$gfp+192|0;HEAP32[$lowpasswidth1>>2]=$lowpasswidth;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_lowpasswidth($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $lowpasswidth=$gfp+192|0;var $0=HEAP32[$lowpasswidth>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_highpassfreq($gfp,$highpassfreq){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $highpassfreq1=$gfp+188|0;HEAP32[$highpassfreq1>>2]=$highpassfreq;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_highpassfreq($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $highpassfreq=$gfp+188|0;var $0=HEAP32[$highpassfreq>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_highpasswidth($gfp,$highpasswidth){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $highpasswidth1=$gfp+196|0;HEAP32[$highpasswidth1>>2]=$highpasswidth;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_highpasswidth($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $highpasswidth=$gfp+196|0;var $0=HEAP32[$highpasswidth>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_maskingadjust($gfp,$adjust){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $maskingadjust=$gfp+200|0;HEAPF32[$maskingadjust>>2]=$adjust;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_maskingadjust($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $maskingadjust=$gfp+200|0;var $0=HEAPF32[$maskingadjust>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_maskingadjust_short($gfp,$adjust){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $maskingadjust_short=$gfp+204|0;HEAPF32[$maskingadjust_short>>2]=$adjust;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_maskingadjust_short($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $maskingadjust_short=$gfp+204|0;var $0=HEAPF32[$maskingadjust_short>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_ATHonly($gfp,$ATHonly){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $ATHonly1=$gfp+208|0;HEAP32[$ATHonly1>>2]=$ATHonly;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_ATHonly($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $ATHonly=$gfp+208|0;var $0=HEAP32[$ATHonly>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_ATHshort($gfp,$ATHshort){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $ATHshort1=$gfp+212|0;HEAP32[$ATHshort1>>2]=$ATHshort;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_ATHshort($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $ATHshort=$gfp+212|0;var $0=HEAP32[$ATHshort>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_noATH($gfp,$noATH){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $noATH1=$gfp+216|0;HEAP32[$noATH1>>2]=$noATH;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_noATH($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $noATH=$gfp+216|0;var $0=HEAP32[$noATH>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_ATHtype($gfp,$ATHtype){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $ATHtype1=$gfp+220|0;HEAP32[$ATHtype1>>2]=$ATHtype;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_ATHtype($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $ATHtype=$gfp+220|0;var $0=HEAP32[$ATHtype>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_ATHcurve($gfp,$ATHcurve){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $ATHcurve1=$gfp+224|0;HEAPF32[$ATHcurve1>>2]=$ATHcurve;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_ATHcurve($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $ATHcurve=$gfp+224|0;var $0=HEAPF32[$ATHcurve>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_ATHlower($gfp,$ATHlower){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $ATH_lower_db=$gfp+228|0;HEAPF32[$ATH_lower_db>>2]=$ATHlower;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_ATHlower($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $ATH_lower_db=$gfp+228|0;var $0=HEAPF32[$ATH_lower_db>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_athaa_type($gfp,$athaa_type){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $athaa_type1=$gfp+232|0;HEAP32[$athaa_type1>>2]=$athaa_type;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_athaa_type($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $athaa_type=$gfp+232|0;var $0=HEAP32[$athaa_type>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_athaa_loudapprox($gfp,$athaa_loudapprox){return 0}function _lame_get_athaa_loudapprox($gfp){return 2}function _lame_set_athaa_sensitivity($gfp,$athaa_sensitivity){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $athaa_sensitivity1=$gfp+236|0;HEAPF32[$athaa_sensitivity1>>2]=$athaa_sensitivity;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_athaa_sensitivity($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $athaa_sensitivity=$gfp+236|0;var $0=HEAPF32[$athaa_sensitivity>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_cwlimit($gfp,$cwlimit){return 0}function _lame_get_cwlimit($gfp){return 0}function _lame_set_allow_diff_short($gfp,$allow_diff_short){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $not_tobool1=($allow_diff_short|0)==0;var $cond=$not_tobool1&1;var $short_blocks=$gfp+240|0;HEAP32[$short_blocks>>2]=$cond;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_allow_diff_short($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $short_blocks=$gfp+240|0;var $0=HEAP32[$short_blocks>>2];var $cmp=($0|0)==0;var $_=$cmp&1;var $retval_0=$_;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_useTemporal($gfp,$useTemporal){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)!=0;var $0=$useTemporal>>>0<2;var $or_cond=$tobool&$0;if($or_cond){label=2;break}else{var $retval_0=-1;label=3;break};case 2:var $useTemporal3=$gfp+244|0;HEAP32[$useTemporal3>>2]=$useTemporal;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_useTemporal($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $useTemporal=$gfp+244|0;var $0=HEAP32[$useTemporal>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_interChRatio($gfp,$ratio){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $cmp=$ratio<0;var $or_cond=$tobool|$cmp;var $cmp1=$ratio>1;var $or_cond4=$or_cond|$cmp1;if($or_cond4){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $interChRatio=$gfp+248|0;HEAPF32[$interChRatio>>2]=$ratio;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_interChRatio($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $interChRatio=$gfp+248|0;var $0=HEAPF32[$interChRatio>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_substep($gfp,$method){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)!=0;var $0=$method>>>0<8;var $or_cond=$tobool&$0;if($or_cond){label=2;break}else{var $retval_0=-1;label=3;break};case 2:var $substep_shaping=$gfp+80|0;HEAP32[$substep_shaping>>2]=$method;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_substep($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $substep_shaping=$gfp+80|0;var $0=HEAP32[$substep_shaping>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_sfscale($gfp,$val){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $cmp=($val|0)!=0;var $cond=$cmp?2:1;var $noise_shaping=$gfp+84|0;HEAP32[$noise_shaping>>2]=$cond;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_sfscale($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $noise_shaping=$gfp+84|0;var $0=HEAP32[$noise_shaping>>2];var $cmp=($0|0)==2;var $cond=$cmp&1;var $retval_0=$cond;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_subblock_gain($gfp,$sbgain){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $subblock_gain=$gfp+88|0;HEAP32[$subblock_gain>>2]=$sbgain;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_subblock_gain($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $subblock_gain=$gfp+88|0;var $0=HEAP32[$subblock_gain>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_no_short_blocks($gfp,$no_short_blocks){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)!=0;var $0=$no_short_blocks>>>0<2;var $or_cond=$tobool&$0;if($or_cond){label=2;break}else{var $retval_0=-1;label=3;break};case 2:var $tobool3=($no_short_blocks|0)!=0;var $cond=$tobool3?2:0;var $short_blocks=$gfp+240|0;HEAP32[$short_blocks>>2]=$cond;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_no_short_blocks($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=5;break}else{label=2;break};case 2:var $short_blocks=$gfp+240|0;var $0=HEAP32[$short_blocks>>2];if(($0|0)==2){label=3;break}else if(($0|0)==3|($0|0)==0|($0|0)==1){label=4;break}else{var $retval_0=-1;label=5;break};case 3:var $retval_0=1;label=5;break;case 4:var $retval_0=0;label=5;break;case 5:var $retval_0;return $retval_0}}function _lame_set_force_short_blocks($gfp,$short_blocks){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;var $0=$short_blocks>>>0>1;var $or_cond=$tobool|$0;if($or_cond){var $retval_0=-1;label=6;break}else{label=2;break};case 2:var $cmp3=($short_blocks|0)==1;var $short_blocks5=$gfp+240|0;if($cmp3){label=3;break}else{label=4;break};case 3:HEAP32[$short_blocks5>>2]=3;var $retval_0=0;label=6;break;case 4:var $1=HEAP32[$short_blocks5>>2];var $cmp7=($1|0)==3;if($cmp7){label=5;break}else{var $retval_0=0;label=6;break};case 5:HEAP32[$short_blocks5>>2]=0;var $retval_0=0;label=6;break;case 6:var $retval_0;return $retval_0}}function _lame_get_force_short_blocks($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=5;break}else{label=2;break};case 2:var $short_blocks=$gfp+240|0;var $0=HEAP32[$short_blocks>>2];if(($0|0)==2|($0|0)==0|($0|0)==1){label=3;break}else if(($0|0)==3){label=4;break}else{var $retval_0=-1;label=5;break};case 3:var $retval_0=0;label=5;break;case 4:var $retval_0=1;label=5;break;case 5:var $retval_0;return $retval_0}}function _lame_set_short_threshold_lrm($gfp,$lrm){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $attackthre=$gfp+264|0;HEAPF32[$attackthre>>2]=$lrm;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_short_threshold_lrm($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $attackthre=$gfp+264|0;var $0=HEAPF32[$attackthre>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_short_threshold_s($gfp,$s){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $attackthre_s=$gfp+268|0;HEAPF32[$attackthre_s>>2]=$s;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_short_threshold_s($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $attackthre_s=$gfp+268|0;var $0=HEAPF32[$attackthre_s>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_short_threshold($gfp,$lrm,$s){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=6;break}else{label=2;break};case 2:var $call_i=_is_lame_global_flags_valid($gfp);var $tobool_i=($call_i|0)==0;if($tobool_i){label=4;break}else{label=3;break};case 3:var $attackthre_i=$gfp+264|0;HEAPF32[$attackthre_i>>2]=$lrm;label=4;break;case 4:var $call_i3=_is_lame_global_flags_valid($gfp);var $tobool_i4=($call_i3|0)==0;if($tobool_i4){var $retval_0=0;label=6;break}else{label=5;break};case 5:var $attackthre_s_i=$gfp+268|0;HEAPF32[$attackthre_s_i>>2]=$s;var $retval_0=0;label=6;break;case 6:var $retval_0;return $retval_0}}function _lame_set_emphasis($gfp,$emphasis){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)!=0;var $0=$emphasis>>>0<4;var $or_cond=$tobool&$0;if($or_cond){label=2;break}else{var $retval_0=-1;label=3;break};case 2:var $emphasis3=$gfp+116|0;HEAP32[$emphasis3>>2]=$emphasis;var $retval_0=0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_emphasis($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $emphasis=$gfp+116|0;var $0=HEAP32[$emphasis>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_version($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $version=$0+16|0;var $1=HEAP32[$version>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_encoder_delay($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $encoder_delay=$0+84760|0;var $1=HEAP32[$encoder_delay>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_encoder_padding($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $encoder_padding=$0+84764|0;var $1=HEAP32[$encoder_padding>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_framesize($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $mode_gr=$0+76|0;var $1=HEAP32[$mode_gr>>2];var $mul=$1*576&-1;var $retval_0=$mul;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_frameNum($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $frame_number=$0+84748|0;var $1=HEAP32[$frame_number>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_mf_samples_to_encode($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $mf_samples_to_encode=$0+84032|0;var $1=HEAP32[$mf_samples_to_encode>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_size_mp3buffer($gfp){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+8|0;label=1;while(1)switch(label){case 1:var $size=sp;var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $call4=_compute_flushbits($0,$size);var $1=HEAP32[$size>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;STACKTOP=sp;return $retval_0}}function _lame_get_RadioGain($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $RadioGain=$0+85688|0;var $1=HEAP32[$RadioGain>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_AudiophileGain($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){label=3;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);return 0;case 3:return 0}}function _lame_get_PeakSample($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $PeakSample=$0+85684|0;var $1=HEAPF32[$PeakSample>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_noclipGainChange($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $noclipGainChange=$0+85692|0;var $1=HEAP32[$noclipGainChange>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_noclipScale($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $noclipScale=$0+85680|0;var $1=HEAPF32[$noclipScale>>2];var $retval_0=$1;label=4;break;case 4:var $retval_0;return $retval_0}}function _lame_get_totalframes($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=7;break}else{label=2;break};case 2:var $internal_flags=$gfp+288|0;var $0=HEAP32[$internal_flags>>2];var $call1=_is_lame_internal_flags_valid($0);var $tobool2=($call1|0)==0;if($tobool2){var $retval_0=0;label=7;break}else{label=3;break};case 3:var $mode_gr=$0+76|0;var $1=HEAP32[$mode_gr>>2];var $mul=$1*576&-1;var $num_samples=$gfp+4|0;var $2=HEAP32[$num_samples>>2];var $cmp=($2|0)==-1;if($cmp){var $retval_0=0;label=7;break}else{label=4;break};case 4:var $samplerate_in=$gfp+12|0;var $3=HEAP32[$samplerate_in>>2];var $samplerate_out=$gfp+16|0;var $4=HEAP32[$samplerate_out>>2];var $cmp6=($3|0)!=($4|0);var $cmp8=($3|0)>0;var $or_cond=$cmp6&$cmp8;if($or_cond){label=5;break}else{var $pcm_samples_to_encode_0=$2;label=6;break};case 5:var $conv=$4|0;var $conv12=$3|0;var $div=$conv/$conv12;var $conv13=$2>>>0;var $mul14=$conv13*$div;var $conv15=$mul14>=0?Math.floor($mul14):Math.ceil($mul14);var $pcm_samples_to_encode_0=$conv15;label=6;break;case 6:var $pcm_samples_to_encode_0;var $add=$pcm_samples_to_encode_0+576|0;var $rem=($add>>>0)%($mul>>>0)&-1;var $sub=$mul-$rem|0;var $cmp17=$sub>>>0<576;var $add20=$cmp17?$mul:0;var $end_padding_0=$sub+$add|0;var $add22=$end_padding_0+$add20|0;var $div23=($add22>>>0)/($mul>>>0)&-1;var $retval_0=$div23;label=7;break;case 7:var $retval_0;return $retval_0}}function _lame_set_preset($gfp,$preset){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=3;break}else{label=2;break};case 2:var $preset1=$gfp+152|0;HEAP32[$preset1>>2]=$preset;var $call2=_apply_preset($gfp,$preset,1);var $retval_0=$call2;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_asm_optimizations($gfp,$optim,$mode){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=-1;label=6;break}else{label=2;break};case 2:var $cmp=($mode|0)==1;var $cond=$cmp&1;if(($optim|0)==1){label=3;break}else if(($optim|0)==2){label=4;break}else if(($optim|0)==3){label=5;break}else{var $retval_0=$optim;label=6;break};case 3:var $mmx=$gfp+292|0;HEAP32[$mmx>>2]=$cond;var $retval_0=1;label=6;break;case 4:var $amd3dnow=$gfp+296|0;HEAP32[$amd3dnow>>2]=$cond;var $retval_0=2;label=6;break;case 5:var $sse=$gfp+300|0;HEAP32[$sse>>2]=$cond;var $retval_0=3;label=6;break;case 6:var $retval_0;return $retval_0}}function _lame_set_write_id3tag_automatic($gfp,$v){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){label=3;break}else{label=2;break};case 2:var $write_id3tag_automatic=$gfp+68|0;HEAP32[$write_id3tag_automatic>>2]=$v;label=3;break;case 3:return}}function _lame_get_write_id3tag_automatic($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=1;label=3;break}else{label=2;break};case 2:var $write_id3tag_automatic=$gfp+68|0;var $0=HEAP32[$write_id3tag_automatic>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_tune($gfp,$val){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){label=3;break}else{label=2;break};case 2:var $tune_value_a=$gfp+260|0;HEAPF32[$tune_value_a>>2]=$val;var $tune=$gfp+256|0;HEAP32[$tune>>2]=1;label=3;break;case 3:return}}function _lame_set_msfix($gfp,$msfix){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){label=3;break}else{label=2;break};case 2:var $conv=$msfix;var $msfix1=$gfp+252|0;HEAPF32[$msfix1>>2]=$conv;label=3;break;case 3:return}}function _lame_get_msfix($gfp){var label=0;label=1;while(1)switch(label){case 1:var $call=_is_lame_global_flags_valid($gfp);var $tobool=($call|0)==0;if($tobool){var $retval_0=0;label=3;break}else{label=2;break};case 2:var $msfix=$gfp+252|0;var $0=HEAPF32[$msfix>>2];var $retval_0=$0;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_set_preset_expopts($gfp,$preset_expopts){return 0}function _lame_set_preset_notune($gfp,$preset_notune){return 0}function _lame_get_bitrate($mpeg_version,$table_index){var label=0;label=1;while(1)switch(label){case 1:var $0=$mpeg_version>>>0<3;var $1=$table_index>>>0<16;var $or_cond=$0&$1;if($or_cond){label=2;break}else{var $retval_0=-1;label=3;break};case 2:var $arrayidx6=16488+($mpeg_version<<6)+($table_index<<2)|0;var $2=HEAP32[$arrayidx6>>2];var $retval_0=$2;label=3;break;case 3:var $retval_0;return $retval_0}}function _lame_get_samplerate($mpeg_version,$table_index){var label=0;label=1;while(1)switch(label){case 1:var $0=$mpeg_version>>>0<3;var $1=$table_index>>>0<4;var $or_cond=$0&$1;if($or_cond){label=2;break}else{var $retval_0=-1;label=3;break};case 2:var $arrayidx6=9336+($mpeg_version<<4)+($table_index<<2)|0;var $2=HEAP32[$arrayidx6>>2];var $retval_0=$2;label=3;break;case 3:var $retval_0;return $retval_0}}function _noquant_count_bits($gfc,$gi,$prev_noise){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+8|0;label=1;while(1)switch(label){case 1:var $bits=sp;HEAP32[$bits>>2]=0;var $arraydecay=$gi+2304|0;var $max_nonzero_coeff=$gi+5208|0;var $0=HEAP32[$max_nonzero_coeff>>2];var $add=$0+2|0;var $shr100=$add&-2;var $cmp=($shr100|0)>576;var $_shr100=$cmp?576:$shr100;var $tobool=($prev_noise|0)!=0;if($tobool){label=2;break}else{var $i_0=$_shr100;label=3;break};case 2:var $sfb_count1=$prev_noise+4|0;HEAP32[$sfb_count1>>2]=0;var $i_0=$_shr100;label=3;break;case 3:var $i_0;var $cmp6=($i_0|0)>1;if($cmp6){label=5;break}else{label=4;break};case 4:var $count1111=$gi+4776|0;HEAP32[$count1111>>2]=$i_0;label=9;break;case 5:var $sub=$i_0-1|0;var $arrayidx=$gi+2304+($sub<<2)|0;var $1=HEAP32[$arrayidx>>2];var $sub7=$i_0-2|0;var $arrayidx8=$gi+2304+($sub7<<2)|0;var $2=HEAP32[$arrayidx8>>2];var $or=$2|$1;var $tobool9=($or|0)==0;if($tobool9){var $i_0=$sub7;label=3;break}else{label=6;break};case 6:var $count1=$gi+4776|0;HEAP32[$count1>>2]=$i_0;var $cmp14101=($i_0|0)>3;if($cmp14101){var $a2_0102=0;var $a1_0103=0;var $i_1104=$i_0;label=7;break}else{label=9;break};case 7:var $i_1104;var $a1_0103;var $a2_0102;var $sub16=$i_1104-4|0;var $arrayidx17=$gi+2304+($sub16<<2)|0;var $3=HEAP32[$arrayidx17>>2];var $sub18=$i_1104-3|0;var $arrayidx19=$gi+2304+($sub18<<2)|0;var $4=HEAP32[$arrayidx19>>2];var $sub20=$i_1104-2|0;var $arrayidx21=$gi+2304+($sub20<<2)|0;var $5=HEAP32[$arrayidx21>>2];var $sub22=$i_1104-1|0;var $arrayidx23=$gi+2304+($sub22<<2)|0;var $6=HEAP32[$arrayidx23>>2];var $or24=$4|$3;var $or25=$or24|$5;var $or26=$or25|$6;var $cmp27=$or26>>>0>1;if($cmp27){var $a2_0_lcssa=$a2_0102;var $a1_0_lcssa=$a1_0103;var $i_1_lcssa=$i_1104;label=10;break}else{label=8;break};case 8:var $mul=$3<<1;var $add30=$mul+$4|0;var $mul31=$add30<<1;var $add32=$mul31+$5|0;var $mul33=$add32<<1;var $add34=$mul33+$6|0;var $arrayidx35=$add34+2832|0;var $7=HEAP8[$arrayidx35];var $conv=$7&255;var $add36=$conv+$a1_0103|0;var $arrayidx37=$add34+2784|0;var $8=HEAP8[$arrayidx37];var $conv38=$8&255;var $add39=$conv38+$a2_0102|0;var $cmp14=($sub16|0)>3;if($cmp14){var $a2_0102=$add39;var $a1_0103=$add36;var $i_1104=$sub16;label=7;break}else{var $a2_0_lcssa=$add39;var $a1_0_lcssa=$add36;var $i_1_lcssa=$sub16;label=10;break};case 9:HEAP32[$bits>>2]=0;var $count1table_select113=$gi+4840|0;HEAP32[$count1table_select113>>2]=0;var $9=0;var $i_1_lcssa115=$i_0;label=12;break;case 10:var $i_1_lcssa;var $a1_0_lcssa;var $a2_0_lcssa;HEAP32[$bits>>2]=$a1_0_lcssa;var $count1table_select=$gi+4840|0;HEAP32[$count1table_select>>2]=0;var $cmp43=($a1_0_lcssa|0)>($a2_0_lcssa|0);if($cmp43){label=11;break}else{var $9=$a1_0_lcssa;var $i_1_lcssa115=$i_1_lcssa;label=12;break};case 11:HEAP32[$bits>>2]=$a2_0_lcssa;HEAP32[$count1table_select>>2]=1;var $9=$a2_0_lcssa;var $i_1_lcssa115=$i_1_lcssa;label=12;break;case 12:var $i_1_lcssa115;var $9;var $count1bits=$gi+5184|0;HEAP32[$count1bits>>2]=$9;var $big_values=$gi+4772|0;HEAP32[$big_values>>2]=$i_1_lcssa115;var $cmp48=($i_1_lcssa115|0)==0;if($cmp48){label=29;break}else{label=13;break};case 13:var $block_type=$gi+4788|0;var $10=HEAP32[$block_type>>2];if(($10|0)==2){label=14;break}else if(($10|0)==0){label=15;break}else{label=17;break};case 14:var $arrayidx55=$gfc+21464|0;var $11=HEAP32[$arrayidx55>>2];var $mul56=$11*3&-1;var $cmp58=($mul56|0)>($i_1_lcssa115|0);var $i_1_mul56=$cmp58?$i_1_lcssa115:$mul56;var $a1_2=$i_1_mul56;var $a2_1=$i_1_lcssa115;label=18;break;case 15:var $sub68=$i_1_lcssa115-2|0;var $arrayidx69=$sub68+($gfc+85100)|0;var $12=HEAP8[$arrayidx69];var $conv70=$12<<24>>24;var $region0_count=$gi+4824|0;HEAP32[$region0_count>>2]=$conv70;var $sub71=$i_1_lcssa115-1|0;var $arrayidx74=$sub71+($gfc+85100)|0;var $13=HEAP8[$arrayidx74];var $conv75=$13<<24>>24;var $region1_count=$gi+4828|0;HEAP32[$region1_count>>2]=$conv75;var $add76=$conv70+2|0;var $add77=$add76+$conv75|0;var $arrayidx79=$gfc+21360+($add77<<2)|0;var $14=HEAP32[$arrayidx79>>2];var $add80=$conv70+1|0;var $arrayidx83=$gfc+21360+($add80<<2)|0;var $15=HEAP32[$arrayidx83>>2];var $cmp84=($14|0)<($i_1_lcssa115|0);if($cmp84){label=16;break}else{var $a1_2=$15;var $a2_1=$14;label=18;break};case 16:var $choose_table=$gfc+85816|0;var $16=HEAP32[$choose_table>>2];var $add_ptr=$gi+2304+($14<<2)|0;var $add_ptr87=$gi+2304+($i_1_lcssa115<<2)|0;var $call=FUNCTION_TABLE[$16]($add_ptr,$add_ptr87,$bits);var $arrayidx88=$gi+4804|0;HEAP32[$arrayidx88>>2]=$call;var $a1_2=$15;var $a2_1=$14;label=18;break;case 17:var $region0_count91=$gi+4824|0;HEAP32[$region0_count91>>2]=7;var $region1_count92=$gi+4828|0;HEAP32[$region1_count92>>2]=13;var $arrayidx95=$gfc+21392|0;var $17=HEAP32[$arrayidx95>>2];var $cmp96=($17|0)>($i_1_lcssa115|0);var $i_1_=$cmp96?$i_1_lcssa115:$17;var $a1_2=$i_1_;var $a2_1=$i_1_lcssa115;label=18;break;case 18:var $a2_1;var $a1_2;var $cmp102=($a1_2|0)<($i_1_lcssa115|0);var $cond107=$cmp102?$a1_2:$i_1_lcssa115;var $cmp108=($a2_1|0)<($i_1_lcssa115|0);var $cond113=$cmp108?$a2_1:$i_1_lcssa115;var $cmp114=($cond107|0)>0;if($cmp114){label=19;break}else{label=20;break};case 19:var $choose_table117=$gfc+85816|0;var $18=HEAP32[$choose_table117>>2];var $add_ptr118=$gi+2304+($cond107<<2)|0;var $call119=FUNCTION_TABLE[$18]($arraydecay,$add_ptr118,$bits);var $arrayidx121=$gi+4796|0;HEAP32[$arrayidx121>>2]=$call119;label=20;break;case 20:var $cmp123=($cond107|0)<($cond113|0);if($cmp123){label=21;break}else{label=22;break};case 21:var $choose_table126=$gfc+85816|0;var $19=HEAP32[$choose_table126>>2];var $add_ptr127=$gi+2304+($cond107<<2)|0;var $add_ptr128=$gi+2304+($cond113<<2)|0;var $call129=FUNCTION_TABLE[$19]($add_ptr127,$add_ptr128,$bits);var $arrayidx131=$gi+4800|0;HEAP32[$arrayidx131>>2]=$call129;label=22;break;case 22:var $use_best_huffman=$gfc+36|0;var $20=HEAP32[$use_best_huffman>>2];var $cmp133=($20|0)==2;if($cmp133){label=23;break}else{label=24;break};case 23:var $21=HEAP32[$bits>>2];var $part2_3_length=$gi+4768|0;HEAP32[$part2_3_length>>2]=$21;_best_huffman_divide($gfc,$gi);var $22=HEAP32[$part2_3_length>>2];HEAP32[$bits>>2]=$22;label=24;break;case 24:if($tobool){label=25;break}else{label=29;break};case 25:var $23=HEAP32[$block_type>>2];var $cmp141=($23|0)==0;if($cmp141){label=26;break}else{label=29;break};case 26:var $24=HEAP32[$big_values>>2];var $sfb_0=0;label=27;break;case 27:var $sfb_0;var $arrayidx146=$gfc+21360+($sfb_0<<2)|0;var $25=HEAP32[$arrayidx146>>2];var $cmp148=($25|0)<($24|0);var $inc=$sfb_0+1|0;if($cmp148){var $sfb_0=$inc;label=27;break}else{label=28;break};case 28:var $sfb_count1150=$prev_noise+4|0;HEAP32[$sfb_count1150>>2]=$sfb_0;label=29;break;case 29:var $retval_0=HEAP32[$bits>>2];STACKTOP=sp;return $retval_0}}function _best_huffman_divide($gfc,$gi){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+5672|0;label=1;while(1)switch(label){case 1:var $bits_i62=sp;var $bits_i54=sp+8;var $bits_i=sp+16;var $r0bits_i=sp+24;var $cod_info2=sp+32;var $r01_bits=sp+5288;var $r01_div=sp+5384;var $r0_tbl=sp+5480;var $r1_tbl=sp+5576;var $arraydecay=$gi+2304|0;var $block_type=$gi+4788|0;var $0=HEAP32[$block_type>>2];var $cmp=($0|0)==2;if($cmp){label=2;break}else{label=4;break};case 2:var $mode_gr=$gfc+76|0;var $1=HEAP32[$mode_gr>>2];var $cmp2=($1|0)==1;if($cmp2){label=38;break}else{label=3;break};case 3:var $2=$cod_info2;var $3=$gi;_memcpy($2,$3,5252)|0;var $7=$2;var $6=$3;label=5;break;case 4:var $4=$cod_info2;var $5=$gi;_memcpy($4,$5,5252)|0;var $cmp4=($0|0)==0;if($cmp4){label=6;break}else{var $7=$4;var $6=$5;label=5;break};case 5:var $6;var $7;var $big_values_pre=$cod_info2+4772|0;var $big_values_pre_phi=$big_values_pre;var $30=$7;var $29=$6;label=20;break;case 6:var $arraydecay6=$r01_bits|0;var $gi_idx=$gi+4772|0;var $gi_idx_val=HEAP32[$gi_idx>>2];var $8=$bits_i;var $9=$r0bits_i;HEAP32[$arraydecay6>>2]=1e5;var $arrayidx_1_i=$r01_bits+4|0;HEAP32[$arrayidx_1_i>>2]=1e5;var $arrayidx_2_i=$r01_bits+8|0;HEAP32[$arrayidx_2_i>>2]=1e5;var $arrayidx_3_i=$r01_bits+12|0;HEAP32[$arrayidx_3_i>>2]=1e5;var $arrayidx_4_i=$r01_bits+16|0;HEAP32[$arrayidx_4_i>>2]=1e5;var $arrayidx_5_i=$r01_bits+20|0;HEAP32[$arrayidx_5_i>>2]=1e5;var $arrayidx_6_i=$r01_bits+24|0;HEAP32[$arrayidx_6_i>>2]=1e5;var $arrayidx_7_i=$r01_bits+28|0;HEAP32[$arrayidx_7_i>>2]=1e5;var $arrayidx_8_i=$r01_bits+32|0;HEAP32[$arrayidx_8_i>>2]=1e5;var $arrayidx_9_i=$r01_bits+36|0;HEAP32[$arrayidx_9_i>>2]=1e5;var $arrayidx_10_i=$r01_bits+40|0;HEAP32[$arrayidx_10_i>>2]=1e5;var $arrayidx_11_i=$r01_bits+44|0;HEAP32[$arrayidx_11_i>>2]=1e5;var $arrayidx_12_i=$r01_bits+48|0;HEAP32[$arrayidx_12_i>>2]=1e5;var $arrayidx_13_i=$r01_bits+52|0;HEAP32[$arrayidx_13_i>>2]=1e5;var $arrayidx_14_i=$r01_bits+56|0;HEAP32[$arrayidx_14_i>>2]=1e5;var $arrayidx_15_i=$r01_bits+60|0;HEAP32[$arrayidx_15_i>>2]=1e5;var $arrayidx_16_i=$r01_bits+64|0;HEAP32[$arrayidx_16_i>>2]=1e5;var $arrayidx_17_i=$r01_bits+68|0;HEAP32[$arrayidx_17_i>>2]=1e5;var $arrayidx_18_i=$r01_bits+72|0;HEAP32[$arrayidx_18_i>>2]=1e5;var $arrayidx_19_i=$r01_bits+76|0;HEAP32[$arrayidx_19_i>>2]=1e5;var $arrayidx_20_i=$r01_bits+80|0;HEAP32[$arrayidx_20_i>>2]=1e5;var $arrayidx_21_i=$r01_bits+84|0;HEAP32[$arrayidx_21_i>>2]=1e5;var $arrayidx_22_i=$r01_bits+88|0;HEAP32[$arrayidx_22_i>>2]=1e5;var $choose_table_i=$gfc+85816|0;var $r0_12_i=0;label=8;break;case 7:var $cmp2_i=($add_i|0)<16;if($cmp2_i){var $r0_12_i=$add_i;label=8;break}else{label=14;break};case 8:var $r0_12_i;var $add_i=$r0_12_i+1|0;var $arrayidx4_i=$gfc+21360+($add_i<<2)|0;var $10=HEAP32[$arrayidx4_i>>2];var $cmp5_i=($10|0)<($gi_idx_val|0);if($cmp5_i){label=9;break}else{label=14;break};case 9:HEAP32[$r0bits_i>>2]=0;var $11=HEAP32[$choose_table_i>>2];var $add_ptr_i=$gi+2304+($10<<2)|0;var $call_i=FUNCTION_TABLE[$11]($arraydecay,$add_ptr_i,$r0bits_i);var $r1_01_i=0;label=10;break;case 10:var $r1_01_i;var $add9_i=$r1_01_i+$r0_12_i|0;var $add10_i=$add9_i+2|0;var $arrayidx13_i=$gfc+21360+($add10_i<<2)|0;var $12=HEAP32[$arrayidx13_i>>2];var $cmp14_i=($12|0)<($gi_idx_val|0);if($cmp14_i){label=11;break}else{label=7;break};case 11:var $13=HEAP32[$r0bits_i>>2];HEAP32[$bits_i>>2]=$13;var $14=HEAP32[$choose_table_i>>2];var $add_ptr19_i=$gi+2304+($12<<2)|0;var $call20_i=FUNCTION_TABLE[$14]($add_ptr_i,$add_ptr19_i,$bits_i);var $arrayidx22_i=$r01_bits+($add9_i<<2)|0;var $15=HEAP32[$arrayidx22_i>>2];var $16=HEAP32[$bits_i>>2];var $cmp23_i=($15|0)>($16|0);if($cmp23_i){label=12;break}else{label=13;break};case 12:HEAP32[$arrayidx22_i>>2]=$16;var $arrayidx28_i=$r01_div+($add9_i<<2)|0;HEAP32[$arrayidx28_i>>2]=$r0_12_i;var $arrayidx30_i=$r0_tbl+($add9_i<<2)|0;HEAP32[$arrayidx30_i>>2]=$call_i;var $arrayidx32_i=$r1_tbl+($add9_i<<2)|0;HEAP32[$arrayidx32_i>>2]=$call20_i;label=13;break;case 13:var $inc35_i=$r1_01_i+1|0;var $cmp7_i=($inc35_i|0)<8;if($cmp7_i){var $r1_01_i=$inc35_i;label=10;break}else{label=7;break};case 14:var $17=$bits_i54;var $big_values_i=$cod_info2+4772|0;var $18=HEAP32[$big_values_i>>2];var $count1bits_i=$cod_info2+5184|0;var $part2_3_length_i=$gi+4768|0;var $add_ptr6_i=$gi+2304+($18<<2)|0;var $region0_count_i=$gi+4824|0;var $region1_count_i=$gi+4828|0;var $arrayidx20_i=$gi+4796|0;var $arrayidx24_i=$gi+4800|0;var $arrayidx26_i=$gi+4804|0;var $r2_024_i=2;label=15;break;case 15:var $r2_024_i;var $arrayidx_i=$gfc+21360+($r2_024_i<<2)|0;var $19=HEAP32[$arrayidx_i>>2];var $cmp1_i=($19|0)<($18|0);if($cmp1_i){label=16;break}else{var $big_values_pre_phi=$big_values_i;var $30=$4;var $29=$5;label=20;break};case 16:var $sub_i=$r2_024_i-2|0;var $arrayidx2_i=$r01_bits+($sub_i<<2)|0;var $20=HEAP32[$arrayidx2_i>>2];var $21=HEAP32[$count1bits_i>>2];var $add_i56=$21+$20|0;HEAP32[$bits_i54>>2]=$add_i56;var $22=HEAP32[$part2_3_length_i>>2];var $cmp3_i=($22|0)>($add_i56|0);if($cmp3_i){label=17;break}else{var $big_values_pre_phi=$big_values_i;var $30=$4;var $29=$5;label=20;break};case 17:var $23=HEAP32[$choose_table_i>>2];var $add_ptr_i58=$gi+2304+($19<<2)|0;var $call_i59=FUNCTION_TABLE[$23]($add_ptr_i58,$add_ptr6_i,$bits_i54);var $24=HEAP32[$part2_3_length_i>>2];var $25=HEAP32[$bits_i54>>2];var $cmp8_i=($24|0)>($25|0);if($cmp8_i){label=18;break}else{label=19;break};case 18:_memcpy($5,$4,5252)|0;HEAP32[$part2_3_length_i>>2]=$25;var $arrayidx13_i60=$r01_div+($sub_i<<2)|0;var $26=HEAP32[$arrayidx13_i60>>2];HEAP32[$region0_count_i>>2]=$26;var $sub17_i=$sub_i-$26|0;HEAP32[$region1_count_i>>2]=$sub17_i;var $arrayidx19_i=$r0_tbl+($sub_i<<2)|0;var $27=HEAP32[$arrayidx19_i>>2];HEAP32[$arrayidx20_i>>2]=$27;var $arrayidx22_i61=$r1_tbl+($sub_i<<2)|0;var $28=HEAP32[$arrayidx22_i61>>2];HEAP32[$arrayidx24_i>>2]=$28;HEAP32[$arrayidx26_i>>2]=$call_i59;label=19;break;case 19:var $inc_i=$r2_024_i+1|0;var $cmp_i=($inc_i|0)<23;if($cmp_i){var $r2_024_i=$inc_i;label=15;break}else{var $big_values_pre_phi=$big_values_i;var $30=$4;var $29=$5;label=20;break};case 20:var $29;var $30;var $big_values_pre_phi;var $31=HEAP32[$big_values_pre_phi>>2];var $cmp15=($31|0)==0;if($cmp15){label=38;break}else{label=21;break};case 21:var $sub=$31-2|0;var $arrayidx=$gi+2304+($sub<<2)|0;var $32=HEAP32[$arrayidx>>2];var $sub16=$31-1|0;var $arrayidx17=$gi+2304+($sub16<<2)|0;var $33=HEAP32[$arrayidx17>>2];var $or=$33|$32;var $cmp18=$or>>>0>1;if($cmp18){label=38;break}else{label=22;break};case 22:var $count1=$gi+4776|0;var $34=HEAP32[$count1>>2];var $add=$34+2|0;var $cmp21=($add|0)>576;if($cmp21){label=38;break}else{label=23;break};case 23:_memcpy($30,$29,5252)|0;var $count124=$cod_info2+4776|0;HEAP32[$count124>>2]=$add;var $35=HEAP32[$big_values_pre_phi>>2];var $cmp2695=($add|0)>($35|0);if($cmp2695){var $a2_096=0;var $a1_097=0;var $i_098=$add;label=24;break}else{var $a2_0_lcssa=0;var $a1_0_lcssa=0;var $42=$add;label=25;break};case 24:var $i_098;var $a1_097;var $a2_096;var $sub27=$i_098-4|0;var $arrayidx28=$gi+2304+($sub27<<2)|0;var $36=HEAP32[$arrayidx28>>2];var $mul=$36<<1;var $sub29=$i_098-3|0;var $arrayidx30=$gi+2304+($sub29<<2)|0;var $37=HEAP32[$arrayidx30>>2];var $add31=$mul+$37|0;var $mul32=$add31<<1;var $sub33=$i_098-2|0;var $arrayidx34=$gi+2304+($sub33<<2)|0;var $38=HEAP32[$arrayidx34>>2];var $add35=$mul32+$38|0;var $mul36=$add35<<1;var $sub37=$i_098-1|0;var $arrayidx38=$gi+2304+($sub37<<2)|0;var $39=HEAP32[$arrayidx38>>2];var $add39=$mul36+$39|0;var $arrayidx40=$add39+2832|0;var $40=HEAP8[$arrayidx40];var $conv=$40&255;var $add41=$conv+$a1_097|0;var $arrayidx42=$add39+2784|0;var $41=HEAP8[$arrayidx42];var $conv43=$41&255;var $add44=$conv43+$a2_096|0;var $cmp26=($sub27|0)>($35|0);if($cmp26){var $a2_096=$add44;var $a1_097=$add41;var $i_098=$sub27;label=24;break}else{var $a2_0_lcssa=$add44;var $a1_0_lcssa=$add41;var $42=$sub27;label=25;break};case 25:var $42;var $a1_0_lcssa;var $a2_0_lcssa;HEAP32[$big_values_pre_phi>>2]=$42;var $count1table_select=$cod_info2+4840|0;var $cmp47=($a1_0_lcssa|0)>($a2_0_lcssa|0);var $_=$cmp47&1;var $a2_0_a1_0=$cmp47?$a2_0_lcssa:$a1_0_lcssa;HEAP32[$count1table_select>>2]=$_;var $count1bits=$cod_info2+5184|0;HEAP32[$count1bits>>2]=$a2_0_a1_0;var $block_type52=$cod_info2+4788|0;var $43=HEAP32[$block_type52>>2];var $cmp53=($43|0)==0;if($cmp53){label=26;break}else{label=32;break};case 26:var $44=$bits_i62;var $part2_3_length_i65=$gi+4768|0;var $choose_table_i66=$gfc+85816|0;var $add_ptr6_i67=$gi+2304+($42<<2)|0;var $region0_count_i68=$gi+4824|0;var $region1_count_i69=$gi+4828|0;var $arrayidx20_i70=$gi+4796|0;var $arrayidx24_i71=$gi+4800|0;var $arrayidx26_i72=$gi+4804|0;var $r2_024_i73=2;label=27;break;case 27:var $r2_024_i73;var $arrayidx_i74=$gfc+21360+($r2_024_i73<<2)|0;var $45=HEAP32[$arrayidx_i74>>2];var $cmp1_i75=($45|0)<($42|0);if($cmp1_i75){label=28;break}else{label=38;break};case 28:var $sub_i77=$r2_024_i73-2|0;var $arrayidx2_i78=$r01_bits+($sub_i77<<2)|0;var $46=HEAP32[$arrayidx2_i78>>2];var $47=HEAP32[$count1bits>>2];var $add_i79=$47+$46|0;HEAP32[$bits_i62>>2]=$add_i79;var $48=HEAP32[$part2_3_length_i65>>2];var $cmp3_i80=($48|0)>($add_i79|0);if($cmp3_i80){label=29;break}else{label=38;break};case 29:var $49=HEAP32[$choose_table_i66>>2];var $add_ptr_i82=$gi+2304+($45<<2)|0;var $call_i83=FUNCTION_TABLE[$49]($add_ptr_i82,$add_ptr6_i67,$bits_i62);var $50=HEAP32[$part2_3_length_i65>>2];var $51=HEAP32[$bits_i62>>2];var $cmp8_i84=($50|0)>($51|0);if($cmp8_i84){label=30;break}else{label=31;break};case 30:_memcpy($29,$30,5252)|0;HEAP32[$part2_3_length_i65>>2]=$51;var $arrayidx13_i86=$r01_div+($sub_i77<<2)|0;var $52=HEAP32[$arrayidx13_i86>>2];HEAP32[$region0_count_i68>>2]=$52;var $sub17_i87=$sub_i77-$52|0;HEAP32[$region1_count_i69>>2]=$sub17_i87;var $arrayidx19_i88=$r0_tbl+($sub_i77<<2)|0;var $53=HEAP32[$arrayidx19_i88>>2];HEAP32[$arrayidx20_i70>>2]=$53;var $arrayidx22_i89=$r1_tbl+($sub_i77<<2)|0;var $54=HEAP32[$arrayidx22_i89>>2];HEAP32[$arrayidx24_i71>>2]=$54;HEAP32[$arrayidx26_i72>>2]=$call_i83;label=31;break;case 31:var $inc_i91=$r2_024_i73+1|0;var $cmp_i92=($inc_i91|0)<23;if($cmp_i92){var $r2_024_i73=$inc_i91;label=27;break}else{label=38;break};case 32:var $part2_3_length=$cod_info2+4768|0;HEAP32[$part2_3_length>>2]=$a2_0_a1_0;var $arrayidx60=$gfc+21392|0;var $55=HEAP32[$arrayidx60>>2];var $cmp61=($55|0)>($42|0);var $i_0_=$cmp61?$42:$55;var $cmp65=($i_0_|0)>0;if($cmp65){label=33;break}else{label=34;break};case 33:var $choose_table=$gfc+85816|0;var $56=HEAP32[$choose_table>>2];var $add_ptr=$gi+2304+($i_0_<<2)|0;var $call=FUNCTION_TABLE[$56]($arraydecay,$add_ptr,$part2_3_length);var $arrayidx69=$cod_info2+4796|0;HEAP32[$arrayidx69>>2]=$call;label=34;break;case 34:var $cmp71=($42|0)>($i_0_|0);if($cmp71){label=35;break}else{label=36;break};case 35:var $choose_table74=$gfc+85816|0;var $57=HEAP32[$choose_table74>>2];var $add_ptr75=$gi+2304+($i_0_<<2)|0;var $add_ptr76=$gi+2304+($42<<2)|0;var $call78=FUNCTION_TABLE[$57]($add_ptr75,$add_ptr76,$part2_3_length);var $arrayidx80=$cod_info2+4800|0;HEAP32[$arrayidx80>>2]=$call78;label=36;break;case 36:var $part2_3_length82=$gi+4768|0;var $58=HEAP32[$part2_3_length82>>2];var $59=HEAP32[$part2_3_length>>2];var $cmp84=($58|0)>($59|0);if($cmp84){label=37;break}else{label=38;break};case 37:_memcpy($29,$30,5252)|0;label=38;break;case 38:STACKTOP=sp;return}}function _count_bits($gfc,$xr,$gi,$prev_noise){var label=0;label=1;while(1)switch(label){case 1:var $global_gain=$gi+4780|0;var $0=HEAP32[$global_gain>>2];var $arrayidx=95424+($0<<2)|0;var $1=HEAPF32[$arrayidx>>2];var $div=8206/$1;var $xrpow_max=$gi+4764|0;var $2=HEAPF32[$xrpow_max>>2];var $cmp=$2>$div;if($cmp){var $retval_0=1e5;label=47;break}else{label=2;break};case 2:var $arraydecay=$gi+2304|0;var $tobool_i=($prev_noise|0)!=0;if($tobool_i){label=3;break}else{var $4=0;label=4;break};case 3:var $global_gain1_i=$prev_noise|0;var $3=HEAP32[$global_gain1_i>>2];var $cmp_i=($0|0)==($3|0);var $4=$cmp_i;label=4;break;case 4:var $4;var $block_type_i=$gi+4788|0;var $5=HEAP32[$block_type_i>>2];var $cmp2_i=($5|0)==2;var $__i=$cmp2_i?38:21;var $preflag_i=$gi+4832|0;var $scalefac_scale_i=$gi+4836|0;var $div_i_i=.5945999622344971/$1;var $max_nonzero_coeff_i=$gi+5208|0;var $add45_i=$__i+1|0;var $sfb_count1_i=$prev_noise+4|0;var $j_0156_i=0;var $sfb_0157_i=0;var $iData_0159_i=$arraydecay;var $accumulate_0163_i=0;var $accumulate01_0164_i=0;var $acc_iData_0165_i=$arraydecay;var $acc_xp_0167_i=$xr;var $xp_addr_0169_i=$xr;label=5;break;case 5:var $xp_addr_0169_i;var $acc_xp_0167_i;var $acc_iData_0165_i;var $accumulate01_0164_i;var $accumulate_0163_i;var $iData_0159_i;var $sfb_0157_i;var $j_0156_i;if($4){label=7;break}else{label=6;break};case 6:var $6=HEAP32[$block_type_i>>2];var $cmp6_i=($6|0)==0;if($cmp6_i){label=7;break}else{var $step_0146_i=-1;label=15;break};case 7:var $7=HEAP32[$global_gain>>2];var $arrayidx_i=$gi+4608+($sfb_0157_i<<2)|0;var $8=HEAP32[$arrayidx_i>>2];var $9=HEAP32[$preflag_i>>2];var $tobool9_i=($9|0)==0;if($tobool9_i){var $cond_i=0;label=9;break}else{label=8;break};case 8:var $arrayidx10_i=9640+($sfb_0157_i<<2)|0;var $10=HEAP32[$arrayidx10_i>>2];var $cond_i=$10;label=9;break;case 9:var $cond_i;var $add_i=$cond_i+$8|0;var $11=HEAP32[$scalefac_scale_i>>2];var $add11_i=$11+1|0;var $shl_i=$add_i<<$add11_i;var $sub_i=$7-$shl_i|0;var $arrayidx12_i=$gi+5028+($sfb_0157_i<<2)|0;var $12=HEAP32[$arrayidx12_i>>2];var $arrayidx13_i=$gi+4808+($12<<2)|0;var $13=HEAP32[$arrayidx13_i>>2];var $mul_i=$13<<3;var $sub14_i=$sub_i-$mul_i|0;if($4){label=10;break}else{var $step_0146_i=$sub14_i;label=15;break};case 10:var $arrayidx18_i=$prev_noise+8+($sfb_0157_i<<2)|0;var $14=HEAP32[$arrayidx18_i>>2];var $cmp19_i=($14|0)==($sub14_i|0);if($cmp19_i){label=11;break}else{var $step_0146_i=$sub14_i;label=15;break};case 11:var $tobool21_i=($accumulate_0163_i|0)==0;if($tobool21_i){label=13;break}else{label=12;break};case 12:_quantize_lines_xrpow($accumulate_0163_i,$1,$acc_xp_0167_i,$acc_iData_0165_i);label=13;break;case 13:var $tobool24_i=($accumulate01_0164_i|0)==0;if($tobool24_i){var $acc_xp_5_i=$acc_xp_0167_i;var $acc_iData_5_i=$acc_iData_0165_i;var $accumulate01_4_i=0;var $accumulate_4_i=0;var $sfb_2_i=$sfb_0157_i;label=31;break}else{var $i_011_i_i=0;label=14;break};case 14:var $i_011_i_i;var $arrayidx_i_i=$acc_xp_0167_i+($i_011_i_i<<2)|0;var $15=HEAPF32[$arrayidx_i_i>>2];var $add19_i_i=$i_011_i_i|1;var $arrayidx2_i_i=$acc_xp_0167_i+($add19_i_i<<2)|0;var $16=HEAPF32[$arrayidx2_i_i>>2];var $not_cmp3_i_i=$div_i_i<=$15;var $cond_i_i=$not_cmp3_i_i&1;var $not_cmp4_i_i=$div_i_i<=$16;var $cond5_i_i=$not_cmp4_i_i&1;var $arrayidx7_i_i=$acc_iData_0165_i+($i_011_i_i<<2)|0;HEAP32[$arrayidx7_i_i>>2]=$cond_i_i;var $arrayidx9_i_i=$acc_iData_0165_i+($add19_i_i<<2)|0;HEAP32[$arrayidx9_i_i>>2]=$cond5_i_i;var $add10_i_i=$i_011_i_i+2|0;var $cmp_i_i=$add10_i_i>>>0<$accumulate01_0164_i>>>0;if($cmp_i_i){var $i_011_i_i=$add10_i_i;label=14;break}else{var $acc_xp_5_i=$acc_xp_0167_i;var $acc_iData_5_i=$acc_iData_0165_i;var $accumulate01_4_i=0;var $accumulate_4_i=0;var $sfb_2_i=$sfb_0157_i;label=31;break};case 15:var $step_0146_i;var $arrayidx28_i=$gi+4872+($sfb_0157_i<<2)|0;var $17=HEAP32[$arrayidx28_i>>2];var $add31_i=$17+$j_0156_i|0;var $18=HEAP32[$max_nonzero_coeff_i>>2];var $cmp32_i=($add31_i|0)>($18|0);if($cmp32_i){label=16;break}else{var $l_1_i=$17;var $sfb_1_i=$sfb_0157_i;label=17;break};case 16:var $sub35_i=$18-$j_0156_i|0;var $add36_i=$sub35_i+1|0;var $arrayidx38_i=$gi+2304+($18<<2)|0;var $19=$arrayidx38_i;var $sub40_i=576-$18|0;var $mul41_i=$sub40_i<<2;_memset($19,0,$mul41_i);var $cmp42_i=($add36_i|0)<0;var $_add36_i=$cmp42_i?0:$add36_i;var $l_1_i=$_add36_i;var $sfb_1_i=$add45_i;label=17;break;case 17:var $sfb_1_i;var $l_1_i;var $tobool47_i=($accumulate_0163_i|0)!=0;var $tobool47_not_i=$tobool47_i^1;var $tobool49_i=($accumulate01_0164_i|0)==0;var $or_cond_i=$tobool49_i&$tobool47_not_i;var $acc_iData_1_i=$or_cond_i?$iData_0159_i:$acc_iData_0165_i;var $acc_xp_1_i=$or_cond_i?$xp_addr_0169_i:$acc_xp_0167_i;if($tobool_i){label=18;break}else{label=23;break};case 18:var $20=HEAP32[$sfb_count1_i>>2];var $cmp54_i=($20|0)<1;var $cmp57_i=($sfb_1_i|0)<($20|0);var $or_cond96_i=$cmp54_i|$cmp57_i;if($or_cond96_i){label=23;break}else{label=19;break};case 19:var $arrayidx60_i=$prev_noise+8+($sfb_1_i<<2)|0;var $21=HEAP32[$arrayidx60_i>>2];var $cmp61_i=($21|0)<1;var $cmp65_i=($step_0146_i|0)<($21|0);var $or_cond97_i=$cmp61_i|$cmp65_i;if($or_cond97_i){label=23;break}else{label=20;break};case 20:if($tobool47_i){label=21;break}else{var $acc_xp_2_i=$acc_xp_1_i;var $acc_iData_2_i=$acc_iData_1_i;label=22;break};case 21:_quantize_lines_xrpow($accumulate_0163_i,$1,$acc_xp_1_i,$acc_iData_1_i);var $acc_xp_2_i=$xp_addr_0169_i;var $acc_iData_2_i=$iData_0159_i;label=22;break;case 22:var $acc_iData_2_i;var $acc_xp_2_i;var $add70_i=$l_1_i+$accumulate01_0164_i|0;var $acc_xp_4_i=$acc_xp_2_i;var $acc_iData_4_i=$acc_iData_2_i;var $accumulate01_2_i=$add70_i;var $accumulate_3_i=0;label=26;break;case 23:if($tobool49_i){var $acc_xp_3_i=$acc_xp_1_i;var $acc_iData_3_i=$acc_iData_1_i;label=25;break}else{var $i_011_i116_i=0;label=24;break};case 24:var $i_011_i116_i;var $arrayidx_i117_i=$acc_xp_1_i+($i_011_i116_i<<2)|0;var $22=HEAPF32[$arrayidx_i117_i>>2];var $add19_i118_i=$i_011_i116_i|1;var $arrayidx2_i119_i=$acc_xp_1_i+($add19_i118_i<<2)|0;var $23=HEAPF32[$arrayidx2_i119_i>>2];var $not_cmp3_i120_i=$div_i_i<=$22;var $cond_i121_i=$not_cmp3_i120_i&1;var $not_cmp4_i122_i=$div_i_i<=$23;var $cond5_i123_i=$not_cmp4_i122_i&1;var $arrayidx7_i124_i=$acc_iData_1_i+($i_011_i116_i<<2)|0;HEAP32[$arrayidx7_i124_i>>2]=$cond_i121_i;var $arrayidx9_i125_i=$acc_iData_1_i+($add19_i118_i<<2)|0;HEAP32[$arrayidx9_i125_i>>2]=$cond5_i123_i;var $add10_i126_i=$i_011_i116_i+2|0;var $cmp_i127_i=$add10_i126_i>>>0<$accumulate01_0164_i>>>0;if($cmp_i127_i){var $i_011_i116_i=$add10_i126_i;label=24;break}else{var $acc_xp_3_i=$xp_addr_0169_i;var $acc_iData_3_i=$iData_0159_i;label=25;break};case 25:var $acc_iData_3_i;var $acc_xp_3_i;var $add75_i=$l_1_i+$accumulate_0163_i|0;var $acc_xp_4_i=$acc_xp_3_i;var $acc_iData_4_i=$acc_iData_3_i;var $accumulate01_2_i=0;var $accumulate_3_i=$add75_i;label=26;break;case 26:var $accumulate_3_i;var $accumulate01_2_i;var $acc_iData_4_i;var $acc_xp_4_i;var $cmp77_i=($l_1_i|0)<1;if($cmp77_i){label=27;break}else{var $acc_xp_5_i=$acc_xp_4_i;var $acc_iData_5_i=$acc_iData_4_i;var $accumulate01_4_i=$accumulate01_2_i;var $accumulate_4_i=$accumulate_3_i;var $sfb_2_i=$sfb_1_i;label=31;break};case 27:var $tobool79_i=($accumulate01_2_i|0)==0;if($tobool79_i){label=29;break}else{var $i_011_i132_i=0;label=28;break};case 28:var $i_011_i132_i;var $arrayidx_i133_i=$acc_xp_4_i+($i_011_i132_i<<2)|0;var $24=HEAPF32[$arrayidx_i133_i>>2];var $add19_i134_i=$i_011_i132_i|1;var $arrayidx2_i135_i=$acc_xp_4_i+($add19_i134_i<<2)|0;var $25=HEAPF32[$arrayidx2_i135_i>>2];var $not_cmp3_i136_i=$div_i_i<=$24;var $cond_i137_i=$not_cmp3_i136_i&1;var $not_cmp4_i138_i=$div_i_i<=$25;var $cond5_i139_i=$not_cmp4_i138_i&1;var $arrayidx7_i140_i=$acc_iData_4_i+($i_011_i132_i<<2)|0;HEAP32[$arrayidx7_i140_i>>2]=$cond_i137_i;var $arrayidx9_i141_i=$acc_iData_4_i+($add19_i134_i<<2)|0;HEAP32[$arrayidx9_i141_i>>2]=$cond5_i139_i;var $add10_i142_i=$i_011_i132_i+2|0;var $cmp_i143_i=$add10_i142_i>>>0<$accumulate01_2_i>>>0;if($cmp_i143_i){var $i_011_i132_i=$add10_i142_i;label=28;break}else{label=29;break};case 29:var $tobool82_i=($accumulate_3_i|0)==0;if($tobool82_i){label=38;break}else{label=30;break};case 30:_quantize_lines_xrpow($accumulate_3_i,$1,$acc_xp_4_i,$acc_iData_4_i);label=38;break;case 31:var $sfb_2_i;var $accumulate_4_i;var $accumulate01_4_i;var $acc_iData_5_i;var $acc_xp_5_i;var $cmp87_i=($sfb_2_i|0)>($__i|0);if($cmp87_i){var $xp_addr_1_i=$xp_addr_0169_i;var $iData_1_i=$iData_0159_i;var $j_1_i=$j_0156_i;label=33;break}else{label=32;break};case 32:var $arrayidx90_i=$gi+4872+($sfb_2_i<<2)|0;var $26=HEAP32[$arrayidx90_i>>2];var $add_ptr_i=$iData_0159_i+($26<<2)|0;var $add_ptr93_i=$xp_addr_0169_i+($26<<2)|0;var $add96_i=$26+$j_0156_i|0;var $xp_addr_1_i=$add_ptr93_i;var $iData_1_i=$add_ptr_i;var $j_1_i=$add96_i;label=33;break;case 33:var $j_1_i;var $iData_1_i;var $xp_addr_1_i;var $inc_i=$sfb_2_i+1|0;var $cmp3_i=($inc_i|0)>($__i|0);if($cmp3_i){label=34;break}else{var $j_0156_i=$j_1_i;var $sfb_0157_i=$inc_i;var $iData_0159_i=$iData_1_i;var $accumulate_0163_i=$accumulate_4_i;var $accumulate01_0164_i=$accumulate01_4_i;var $acc_iData_0165_i=$acc_iData_5_i;var $acc_xp_0167_i=$acc_xp_5_i;var $xp_addr_0169_i=$xp_addr_1_i;label=5;break};case 34:var $tobool98_i=($accumulate_4_i|0)==0;if($tobool98_i){label=36;break}else{label=35;break};case 35:_quantize_lines_xrpow($accumulate_4_i,$1,$acc_xp_5_i,$acc_iData_5_i);label=36;break;case 36:var $tobool101_i=($accumulate01_4_i|0)==0;if($tobool101_i){label=38;break}else{var $i_011_i100_i=0;label=37;break};case 37:var $i_011_i100_i;var $arrayidx_i101_i=$acc_xp_5_i+($i_011_i100_i<<2)|0;var $27=HEAPF32[$arrayidx_i101_i>>2];var $add19_i102_i=$i_011_i100_i|1;var $arrayidx2_i103_i=$acc_xp_5_i+($add19_i102_i<<2)|0;var $28=HEAPF32[$arrayidx2_i103_i>>2];var $not_cmp3_i104_i=$div_i_i<=$27;var $cond_i105_i=$not_cmp3_i104_i&1;var $not_cmp4_i106_i=$div_i_i<=$28;var $cond5_i107_i=$not_cmp4_i106_i&1;var $arrayidx7_i108_i=$acc_iData_5_i+($i_011_i100_i<<2)|0;HEAP32[$arrayidx7_i108_i>>2]=$cond_i105_i;var $arrayidx9_i109_i=$acc_iData_5_i+($add19_i102_i<<2)|0;HEAP32[$arrayidx9_i109_i>>2]=$cond5_i107_i;var $add10_i110_i=$i_011_i100_i+2|0;var $cmp_i111_i=$add10_i110_i>>>0<$accumulate01_4_i>>>0;if($cmp_i111_i){var $i_011_i100_i=$add10_i110_i;label=37;break}else{label=38;break};case 38:var $substep_shaping=$gfc+85096|0;var $29=HEAP32[$substep_shaping>>2];var $and=$29&2;var $tobool=($and|0)==0;if($tobool){label=46;break}else{label=39;break};case 39:var $30=HEAP32[$global_gain>>2];var $31=HEAP32[$scalefac_scale_i>>2];var $add=$31+$30|0;var $arrayidx5=95424+($add<<2)|0;var $32=HEAPF32[$arrayidx5>>2];var $conv=$32;var $div6=.634521682242439/$conv;var $conv7=$div6;var $sfbmax=$gi+4860|0;var $33=HEAP32[$sfbmax>>2];var $cmp829=($33|0)>0;if($cmp829){var $j_030=0;var $sfb_031=0;var $34=$33;label=40;break}else{label=46;break};case 40:var $34;var $sfb_031;var $j_030;var $arrayidx11=$gi+4872+($sfb_031<<2)|0;var $35=HEAP32[$arrayidx11>>2];var $arrayidx13=$gfc+84936+($sfb_031<<2)|0;var $36=HEAP32[$arrayidx13>>2];var $tobool14=($36|0)!=0;var $add16=$35+$j_030|0;var $cmp1927=($35|0)>0;var $or_cond=$tobool14&$cmp1927;if($or_cond){var $k_028=$j_030;label=41;break}else{var $39=$34;label=45;break};case 41:var $k_028;var $arrayidx22=$xr+($k_028<<2)|0;var $37=HEAPF32[$arrayidx22>>2];var $cmp23=$37<$conv7;var $arrayidx26_pre=$gi+2304+($k_028<<2)|0;if($cmp23){var $cond=0;label=43;break}else{label=42;break};case 42:var $38=HEAP32[$arrayidx26_pre>>2];var $cond=$38;label=43;break;case 43:var $cond;HEAP32[$arrayidx26_pre>>2]=$cond;var $inc=$k_028+1|0;var $cmp19=($inc|0)<($add16|0);if($cmp19){var $k_028=$inc;label=41;break}else{label=44;break};case 44:var $_pre_pre=HEAP32[$sfbmax>>2];var $39=$_pre_pre;label=45;break;case 45:var $39;var $inc29=$sfb_031+1|0;var $cmp8=($inc29|0)<($39|0);if($cmp8){var $j_030=$add16;var $sfb_031=$inc29;var $34=$39;label=40;break}else{label=46;break};case 46:var $call=_noquant_count_bits($gfc,$gi,$prev_noise);var $retval_0=$call;label=47;break;case 47:var $retval_0;return $retval_0}}function _best_scalefac_store($gfc,$gr,$ch,$l3_side){var label=0;label=1;while(1)switch(label){case 1:var $arrayidx2=$l3_side+($gr*10504&-1)+($ch*5252&-1)|0;var $sfbmax=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4860|0;var $0=HEAP32[$sfbmax>>2];var $cmp83=($0|0)>0;if($cmp83){var $j_084=0;var $recalc_085=0;var $sfb_086=0;var $1=$0;label=2;break}else{var $recalc_0_lcssa=0;var $5=$0;label=8;break};case 2:var $1;var $sfb_086;var $recalc_085;var $j_084;var $arrayidx4=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4872+($sfb_086<<2)|0;var $2=HEAP32[$arrayidx4>>2];var $add=$2+$j_084|0;var $l_0=$j_084;label=3;break;case 3:var $l_0;var $cmp6=($l_0|0)<($add|0);if($cmp6){label=4;break}else{label=5;break};case 4:var $arrayidx8=$l3_side+($gr*10504&-1)+($ch*5252&-1)+2304+($l_0<<2)|0;var $3=HEAP32[$arrayidx8>>2];var $cmp9=($3|0)==0;var $inc=$l_0+1|0;if($cmp9){var $l_0=$inc;label=3;break}else{label=5;break};case 5:var $cmp10=($l_0|0)==($add|0);if($cmp10){label=6;break}else{var $recalc_1=$recalc_085;var $4=$1;label=7;break};case 6:var $arrayidx12=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4608+($sfb_086<<2)|0;HEAP32[$arrayidx12>>2]=-2;var $_pre=HEAP32[$sfbmax>>2];var $recalc_1=-2;var $4=$_pre;label=7;break;case 7:var $4;var $recalc_1;var $inc15=$sfb_086+1|0;var $cmp=($inc15|0)<($4|0);if($cmp){var $j_084=$add;var $recalc_085=$recalc_1;var $sfb_086=$inc15;var $1=$4;label=2;break}else{var $recalc_0_lcssa=$recalc_1;var $5=$4;label=8;break};case 8:var $5;var $recalc_0_lcssa;var $scalefac_scale=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4836|0;var $6=HEAP32[$scalefac_scale>>2];var $tobool=($6|0)==0;var $preflag=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4832|0;if($tobool){label=9;break}else{var $recalc_2=$recalc_0_lcssa;label=18;break};case 9:var $7=HEAP32[$preflag>>2];var $tobool17=($7|0)==0;if($tobool17){label=10;break}else{var $recalc_2=$recalc_0_lcssa;label=18;break};case 10:var $cmp2179=($5|0)>0;if($cmp2179){var $sfb_180=0;var $s_081=0;label=11;break}else{var $recalc_2=$recalc_0_lcssa;label=18;break};case 11:var $s_081;var $sfb_180;var $arrayidx24=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4608+($sfb_180<<2)|0;var $8=HEAP32[$arrayidx24>>2];var $cmp25=($8|0)>0;var $or=$cmp25?$8:0;var $or_s_0=$or|$s_081;var $inc31=$sfb_180+1|0;var $cmp21=($inc31|0)<($5|0);if($cmp21){var $sfb_180=$inc31;var $s_081=$or_s_0;label=11;break}else{label=12;break};case 12:var $and=$or_s_0&1;var $tobool33=($and|0)==0;var $cmp35=($or_s_0|0)!=0;var $or_cond=$tobool33&$cmp35;if($or_cond){label=13;break}else{var $recalc_2=$recalc_0_lcssa;label=18;break};case 13:if($cmp2179){var $sfb_278=0;var $9=$5;label=14;break}else{label=17;break};case 14:var $9;var $sfb_278;var $arrayidx42=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4608+($sfb_278<<2)|0;var $10=HEAP32[$arrayidx42>>2];var $cmp43=($10|0)>0;if($cmp43){label=15;break}else{var $11=$9;label=16;break};case 15:var $shr=$10>>1;HEAP32[$arrayidx42>>2]=$shr;var $_pre90=HEAP32[$sfbmax>>2];var $11=$_pre90;label=16;break;case 16:var $11;var $inc49=$sfb_278+1|0;var $cmp39=($inc49|0)<($11|0);if($cmp39){var $sfb_278=$inc49;var $9=$11;label=14;break}else{label=17;break};case 17:HEAP32[$scalefac_scale>>2]=1;var $recalc_2=1;label=18;break;case 18:var $recalc_2;var $12=HEAP32[$preflag>>2];var $tobool55=($12|0)==0;if($tobool55){label=19;break}else{var $recalc_3=$recalc_2;label=27;break};case 19:var $block_type=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4788|0;var $13=HEAP32[$block_type>>2];var $cmp57=($13|0)==2;if($cmp57){var $recalc_3=$recalc_2;label=27;break}else{label=20;break};case 20:var $mode_gr=$gfc+76|0;var $14=HEAP32[$mode_gr>>2];var $cmp59=($14|0)==2;if($cmp59){var $sfb_3=11;label=21;break}else{var $recalc_3=$recalc_2;label=27;break};case 21:var $sfb_3;var $cmp62=($sfb_3|0)<21;if($cmp62){label=22;break}else{label=23;break};case 22:var $arrayidx65=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4608+($sfb_3<<2)|0;var $15=HEAP32[$arrayidx65>>2];var $arrayidx66=9640+($sfb_3<<2)|0;var $16=HEAP32[$arrayidx66>>2];var $cmp67=($15|0)>=($16|0);var $cmp71=($15|0)==-2;var $or_cond71=$cmp67|$cmp71;var $inc75=$sfb_3+1|0;if($or_cond71){var $sfb_3=$inc75;label=21;break}else{label=23;break};case 23:var $cmp77=($sfb_3|0)==21;if($cmp77){label=24;break}else{var $recalc_3=$recalc_2;label=27;break};case 24:var $arrayidx83=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4652|0;var $17=HEAP32[$arrayidx83>>2];var $cmp84=($17|0)>0;if($cmp84){label=25;break}else{label=26;break};case 25:var $18=HEAP32[9684>>2];var $sub=$17-$18|0;HEAP32[$arrayidx83>>2]=$sub;label=26;break;case 26:var $arrayidx83_1=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4656|0;var $19=HEAP32[$arrayidx83_1>>2];var $cmp84_1=($19|0)>0;if($cmp84_1){label=113;break}else{label=114;break};case 27:var $recalc_3;var $20=$ch<<2;var $21=$20+4|0;var $scevgep=$l3_side+21008+($21<<2)|0;var $scevgep89=$scevgep;HEAP32[$scevgep89>>2]=0;HEAP32[$scevgep89+4>>2]=0;HEAP32[$scevgep89+8>>2]=0;HEAP32[$scevgep89+12>>2]=0;var $mode_gr104=$gfc+76|0;var $22=HEAP32[$mode_gr104>>2];var $cmp105=($22|0)==2;var $cmp107=($gr|0)==1;var $or_cond72=$cmp105&$cmp107;if($or_cond72){label=28;break}else{var $recalc_4=$recalc_3;label=85;break};case 28:var $block_type112=$l3_side+($ch*5252&-1)+4788|0;var $23=HEAP32[$block_type112>>2];var $cmp113=($23|0)==2;if($cmp113){var $recalc_4=$recalc_3;label=85;break}else{label=29;break};case 29:var $block_type118=$l3_side+10504+($ch*5252&-1)+4788|0;var $24=HEAP32[$block_type118>>2];var $cmp119=($24|0)==2;if($cmp119){var $recalc_4=$recalc_3;label=85;break}else{label=30;break};case 30:var $_pre_i=HEAP32[9120>>2];var $25=HEAP32[9124>>2];var $sfb_0_i=$_pre_i;label=31;break;case 31:var $sfb_0_i;var $cmp8_i=($sfb_0_i|0)<($25|0);if($cmp8_i){label=32;break}else{label=33;break};case 32:var $arrayidx10_i=$l3_side+($ch*5252&-1)+4608+($sfb_0_i<<2)|0;var $26=HEAP32[$arrayidx10_i>>2];var $arrayidx12_i=$l3_side+10504+($ch*5252&-1)+4608+($sfb_0_i<<2)|0;var $27=HEAP32[$arrayidx12_i>>2];var $cmp13_i=($26|0)!=($27|0);var $cmp16_i=($27|0)>-1;var $or_cond_i=$cmp13_i&$cmp16_i;var $inc_i=$sfb_0_i+1|0;if($or_cond_i){label=33;break}else{var $sfb_0_i=$inc_i;label=31;break};case 33:var $cmp19_i=($sfb_0_i|0)==($25|0);if($cmp19_i){label=35;break}else{label=34;break};case 34:var $28=HEAP32[9128>>2];var $sfb_0_i_1=$25;label=92;break;case 35:var $cmp2562_i=($_pre_i|0)<($25|0);if($cmp2562_i){label=36;break}else{label=37;break};case 36:var $scevgep65_i=$l3_side+10504+($ch*5252&-1)+4608+($_pre_i<<2)|0;var $scevgep6566_i=$scevgep65_i;var $29=$_pre_i+1|0;var $30=($25|0)>($29|0);var $smax_i=$30?$25:$29;var $31=$smax_i-$_pre_i|0;var $32=$31<<2;_memset($scevgep6566_i,-1,$32);label=37;break;case 37:var $arrayidx33_i=$l3_side+21024+($ch<<4)|0;HEAP32[$arrayidx33_i>>2]=1;label=34;break;case 38:var $c1_1_10_i;var $s1_1_10_i;var $arrayidx61_i=$l3_side+10504+($ch*5252&-1)+4652|0;var $33=HEAP32[$arrayidx61_i>>2];var $cmp62_i=($33|0)==-1;if($cmp62_i){var $s2_1_i=0;var $c2_1_i=0;label=43;break}else{label=42;break};case 39:var $cmp49_i=($82|0)>0;var $_s1_0_i=$cmp49_i?$82:0;var $s1_1_i=$_s1_0_i;var $c1_1_i=1;label=40;break;case 40:var $c1_1_i;var $s1_1_i;var $arrayidx42_1_i=$l3_side+10504+($ch*5252&-1)+4612|0;var $34=HEAP32[$arrayidx42_1_i>>2];var $cmp43_1_i=($34|0)==-1;if($cmp43_1_i){var $s1_1_1_i=$s1_1_i;var $c1_1_1_i=$c1_1_i;label=67;break}else{label=66;break};case 41:var $s2_0_lcssa_i;var $c2_0_lcssa_i;var $part2_length_i=$l3_side+10504+($ch*5252&-1)+4844|0;var $scalefac_compress_i=$l3_side+10504+($ch*5252&-1)+4784|0;var $i_153_i=0;label=44;break;case 42:var $cmp68_i=($33|0)>0;var $_s2_0_i=$cmp68_i?$33:0;var $s2_1_i=$_s2_0_i;var $c2_1_i=1;label=43;break;case 43:var $c2_1_i;var $s2_1_i;var $arrayidx61_1_i=$l3_side+10504+($ch*5252&-1)+4656|0;var $35=HEAP32[$arrayidx61_1_i>>2];var $cmp62_1_i=($35|0)==-1;if($cmp62_1_i){var $s2_1_1_i=$s2_1_i;var $c2_1_1_i=$c2_1_i;label=50;break}else{label=49;break};case 44:var $i_153_i;var $arrayidx79_i=7216+($i_153_i<<2)|0;var $36=HEAP32[$arrayidx79_i>>2];var $cmp80_i=($s1_1_10_i|0)<($36|0);if($cmp80_i){label=45;break}else{label=48;break};case 45:var $arrayidx82_i=7088+($i_153_i<<2)|0;var $37=HEAP32[$arrayidx82_i>>2];var $cmp83_i=($s2_0_lcssa_i|0)<($37|0);if($cmp83_i){label=46;break}else{label=48;break};case 46:var $arrayidx85_i=7152+($i_153_i<<2)|0;var $38=HEAP32[$arrayidx85_i>>2];var $mul_i=Math.imul($38,$c1_1_10_i)|0;var $arrayidx86_i=7024+($i_153_i<<2)|0;var $39=HEAP32[$arrayidx86_i>>2];var $mul87_i=Math.imul($39,$c2_0_lcssa_i)|0;var $add88_i=$mul87_i+$mul_i|0;var $40=HEAP32[$part2_length_i>>2];var $cmp89_i=($40|0)>($add88_i|0);if($cmp89_i){label=47;break}else{label=48;break};case 47:HEAP32[$part2_length_i>>2]=$add88_i;HEAP32[$scalefac_compress_i>>2]=$i_153_i;label=48;break;case 48:var $inc95_i=$i_153_i+1|0;var $cmp77_i=$inc95_i>>>0<16;if($cmp77_i){var $i_153_i=$inc95_i;label=44;break}else{var $recalc_4=0;label=85;break};case 49:var $inc65_1_i=$c2_1_i+1|0;var $cmp68_1_i=($s2_1_i|0)<($35|0);var $_s2_0_1_i=$cmp68_1_i?$35:$s2_1_i;var $s2_1_1_i=$_s2_0_1_i;var $c2_1_1_i=$inc65_1_i;label=50;break;case 50:var $c2_1_1_i;var $s2_1_1_i;var $arrayidx61_2_i=$l3_side+10504+($ch*5252&-1)+4660|0;var $41=HEAP32[$arrayidx61_2_i>>2];var $cmp62_2_i=($41|0)==-1;if($cmp62_2_i){var $s2_1_2_i=$s2_1_1_i;var $c2_1_2_i=$c2_1_1_i;label=52;break}else{label=51;break};case 51:var $inc65_2_i=$c2_1_1_i+1|0;var $cmp68_2_i=($s2_1_1_i|0)<($41|0);var $_s2_0_2_i=$cmp68_2_i?$41:$s2_1_1_i;var $s2_1_2_i=$_s2_0_2_i;var $c2_1_2_i=$inc65_2_i;label=52;break;case 52:var $c2_1_2_i;var $s2_1_2_i;var $arrayidx61_3_i=$l3_side+10504+($ch*5252&-1)+4664|0;var $42=HEAP32[$arrayidx61_3_i>>2];var $cmp62_3_i=($42|0)==-1;if($cmp62_3_i){var $s2_1_3_i=$s2_1_2_i;var $c2_1_3_i=$c2_1_2_i;label=54;break}else{label=53;break};case 53:var $inc65_3_i=$c2_1_2_i+1|0;var $cmp68_3_i=($s2_1_2_i|0)<($42|0);var $_s2_0_3_i=$cmp68_3_i?$42:$s2_1_2_i;var $s2_1_3_i=$_s2_0_3_i;var $c2_1_3_i=$inc65_3_i;label=54;break;case 54:var $c2_1_3_i;var $s2_1_3_i;var $arrayidx61_4_i=$l3_side+10504+($ch*5252&-1)+4668|0;var $43=HEAP32[$arrayidx61_4_i>>2];var $cmp62_4_i=($43|0)==-1;if($cmp62_4_i){var $s2_1_4_i=$s2_1_3_i;var $c2_1_4_i=$c2_1_3_i;label=56;break}else{label=55;break};case 55:var $inc65_4_i=$c2_1_3_i+1|0;var $cmp68_4_i=($s2_1_3_i|0)<($43|0);var $_s2_0_4_i=$cmp68_4_i?$43:$s2_1_3_i;var $s2_1_4_i=$_s2_0_4_i;var $c2_1_4_i=$inc65_4_i;label=56;break;case 56:var $c2_1_4_i;var $s2_1_4_i;var $arrayidx61_5_i=$l3_side+10504+($ch*5252&-1)+4672|0;var $44=HEAP32[$arrayidx61_5_i>>2];var $cmp62_5_i=($44|0)==-1;if($cmp62_5_i){var $s2_1_5_i=$s2_1_4_i;var $c2_1_5_i=$c2_1_4_i;label=58;break}else{label=57;break};case 57:var $inc65_5_i=$c2_1_4_i+1|0;var $cmp68_5_i=($s2_1_4_i|0)<($44|0);var $_s2_0_5_i=$cmp68_5_i?$44:$s2_1_4_i;var $s2_1_5_i=$_s2_0_5_i;var $c2_1_5_i=$inc65_5_i;label=58;break;case 58:var $c2_1_5_i;var $s2_1_5_i;var $arrayidx61_6_i=$l3_side+10504+($ch*5252&-1)+4676|0;var $45=HEAP32[$arrayidx61_6_i>>2];var $cmp62_6_i=($45|0)==-1;if($cmp62_6_i){var $s2_1_6_i=$s2_1_5_i;var $c2_1_6_i=$c2_1_5_i;label=60;break}else{label=59;break};case 59:var $inc65_6_i=$c2_1_5_i+1|0;var $cmp68_6_i=($s2_1_5_i|0)<($45|0);var $_s2_0_6_i=$cmp68_6_i?$45:$s2_1_5_i;var $s2_1_6_i=$_s2_0_6_i;var $c2_1_6_i=$inc65_6_i;label=60;break;case 60:var $c2_1_6_i;var $s2_1_6_i;var $arrayidx61_7_i=$l3_side+10504+($ch*5252&-1)+4680|0;var $46=HEAP32[$arrayidx61_7_i>>2];var $cmp62_7_i=($46|0)==-1;if($cmp62_7_i){var $s2_1_7_i=$s2_1_6_i;var $c2_1_7_i=$c2_1_6_i;label=62;break}else{label=61;break};case 61:var $inc65_7_i=$c2_1_6_i+1|0;var $cmp68_7_i=($s2_1_6_i|0)<($46|0);var $_s2_0_7_i=$cmp68_7_i?$46:$s2_1_6_i;var $s2_1_7_i=$_s2_0_7_i;var $c2_1_7_i=$inc65_7_i;label=62;break;case 62:var $c2_1_7_i;var $s2_1_7_i;var $arrayidx61_8_i=$l3_side+10504+($ch*5252&-1)+4684|0;var $47=HEAP32[$arrayidx61_8_i>>2];var $cmp62_8_i=($47|0)==-1;if($cmp62_8_i){var $s2_1_8_i=$s2_1_7_i;var $c2_1_8_i=$c2_1_7_i;label=64;break}else{label=63;break};case 63:var $inc65_8_i=$c2_1_7_i+1|0;var $cmp68_8_i=($s2_1_7_i|0)<($47|0);var $_s2_0_8_i=$cmp68_8_i?$47:$s2_1_7_i;var $s2_1_8_i=$_s2_0_8_i;var $c2_1_8_i=$inc65_8_i;label=64;break;case 64:var $c2_1_8_i;var $s2_1_8_i;var $arrayidx61_9_i=$l3_side+10504+($ch*5252&-1)+4688|0;var $48=HEAP32[$arrayidx61_9_i>>2];var $cmp62_9_i=($48|0)==-1;if($cmp62_9_i){var $c2_0_lcssa_i=$c2_1_8_i;var $s2_0_lcssa_i=$s2_1_8_i;label=41;break}else{label=65;break};case 65:var $inc65_9_i=$c2_1_8_i+1|0;var $cmp68_9_i=($s2_1_8_i|0)<($48|0);var $_s2_0_9_i=$cmp68_9_i?$48:$s2_1_8_i;var $c2_0_lcssa_i=$inc65_9_i;var $s2_0_lcssa_i=$_s2_0_9_i;label=41;break;case 66:var $inc46_1_i=$c1_1_i+1|0;var $cmp49_1_i=($s1_1_i|0)<($34|0);var $_s1_0_1_i=$cmp49_1_i?$34:$s1_1_i;var $s1_1_1_i=$_s1_0_1_i;var $c1_1_1_i=$inc46_1_i;label=67;break;case 67:var $c1_1_1_i;var $s1_1_1_i;var $arrayidx42_2_i=$l3_side+10504+($ch*5252&-1)+4616|0;var $49=HEAP32[$arrayidx42_2_i>>2];var $cmp43_2_i=($49|0)==-1;if($cmp43_2_i){var $s1_1_2_i=$s1_1_1_i;var $c1_1_2_i=$c1_1_1_i;label=69;break}else{label=68;break};case 68:var $inc46_2_i=$c1_1_1_i+1|0;var $cmp49_2_i=($s1_1_1_i|0)<($49|0);var $_s1_0_2_i=$cmp49_2_i?$49:$s1_1_1_i;var $s1_1_2_i=$_s1_0_2_i;var $c1_1_2_i=$inc46_2_i;label=69;break;case 69:var $c1_1_2_i;var $s1_1_2_i;var $arrayidx42_3_i=$l3_side+10504+($ch*5252&-1)+4620|0;var $50=HEAP32[$arrayidx42_3_i>>2];var $cmp43_3_i=($50|0)==-1;if($cmp43_3_i){var $s1_1_3_i=$s1_1_2_i;var $c1_1_3_i=$c1_1_2_i;label=71;break}else{label=70;break};case 70:var $inc46_3_i=$c1_1_2_i+1|0;var $cmp49_3_i=($s1_1_2_i|0)<($50|0);var $_s1_0_3_i=$cmp49_3_i?$50:$s1_1_2_i;var $s1_1_3_i=$_s1_0_3_i;var $c1_1_3_i=$inc46_3_i;label=71;break;case 71:var $c1_1_3_i;var $s1_1_3_i;var $arrayidx42_4_i=$l3_side+10504+($ch*5252&-1)+4624|0;var $51=HEAP32[$arrayidx42_4_i>>2];var $cmp43_4_i=($51|0)==-1;if($cmp43_4_i){var $s1_1_4_i=$s1_1_3_i;var $c1_1_4_i=$c1_1_3_i;label=73;break}else{label=72;break};case 72:var $inc46_4_i=$c1_1_3_i+1|0;var $cmp49_4_i=($s1_1_3_i|0)<($51|0);var $_s1_0_4_i=$cmp49_4_i?$51:$s1_1_3_i;var $s1_1_4_i=$_s1_0_4_i;var $c1_1_4_i=$inc46_4_i;label=73;break;case 73:var $c1_1_4_i;var $s1_1_4_i;var $arrayidx42_5_i=$l3_side+10504+($ch*5252&-1)+4628|0;var $52=HEAP32[$arrayidx42_5_i>>2];var $cmp43_5_i=($52|0)==-1;if($cmp43_5_i){var $s1_1_5_i=$s1_1_4_i;var $c1_1_5_i=$c1_1_4_i;label=75;break}else{label=74;break};case 74:var $inc46_5_i=$c1_1_4_i+1|0;var $cmp49_5_i=($s1_1_4_i|0)<($52|0);var $_s1_0_5_i=$cmp49_5_i?$52:$s1_1_4_i;var $s1_1_5_i=$_s1_0_5_i;var $c1_1_5_i=$inc46_5_i;label=75;break;case 75:var $c1_1_5_i;var $s1_1_5_i;var $arrayidx42_6_i=$l3_side+10504+($ch*5252&-1)+4632|0;var $53=HEAP32[$arrayidx42_6_i>>2];var $cmp43_6_i=($53|0)==-1;if($cmp43_6_i){var $s1_1_6_i=$s1_1_5_i;var $c1_1_6_i=$c1_1_5_i;label=77;break}else{label=76;break};case 76:var $inc46_6_i=$c1_1_5_i+1|0;var $cmp49_6_i=($s1_1_5_i|0)<($53|0);var $_s1_0_6_i=$cmp49_6_i?$53:$s1_1_5_i;var $s1_1_6_i=$_s1_0_6_i;var $c1_1_6_i=$inc46_6_i;label=77;break;case 77:var $c1_1_6_i;var $s1_1_6_i;var $arrayidx42_7_i=$l3_side+10504+($ch*5252&-1)+4636|0;var $54=HEAP32[$arrayidx42_7_i>>2];var $cmp43_7_i=($54|0)==-1;if($cmp43_7_i){var $s1_1_7_i=$s1_1_6_i;var $c1_1_7_i=$c1_1_6_i;label=79;break}else{label=78;break};case 78:var $inc46_7_i=$c1_1_6_i+1|0;var $cmp49_7_i=($s1_1_6_i|0)<($54|0);var $_s1_0_7_i=$cmp49_7_i?$54:$s1_1_6_i;var $s1_1_7_i=$_s1_0_7_i;var $c1_1_7_i=$inc46_7_i;label=79;break;case 79:var $c1_1_7_i;var $s1_1_7_i;var $arrayidx42_8_i=$l3_side+10504+($ch*5252&-1)+4640|0;var $55=HEAP32[$arrayidx42_8_i>>2];var $cmp43_8_i=($55|0)==-1;if($cmp43_8_i){var $s1_1_8_i=$s1_1_7_i;var $c1_1_8_i=$c1_1_7_i;label=81;break}else{label=80;break};case 80:var $inc46_8_i=$c1_1_7_i+1|0;var $cmp49_8_i=($s1_1_7_i|0)<($55|0);var $_s1_0_8_i=$cmp49_8_i?$55:$s1_1_7_i;var $s1_1_8_i=$_s1_0_8_i;var $c1_1_8_i=$inc46_8_i;label=81;break;case 81:var $c1_1_8_i;var $s1_1_8_i;var $arrayidx42_9_i=$l3_side+10504+($ch*5252&-1)+4644|0;var $56=HEAP32[$arrayidx42_9_i>>2];var $cmp43_9_i=($56|0)==-1;if($cmp43_9_i){var $s1_1_9_i=$s1_1_8_i;var $c1_1_9_i=$c1_1_8_i;label=83;break}else{label=82;break};case 82:var $inc46_9_i=$c1_1_8_i+1|0;var $cmp49_9_i=($s1_1_8_i|0)<($56|0);var $_s1_0_9_i=$cmp49_9_i?$56:$s1_1_8_i;var $s1_1_9_i=$_s1_0_9_i;var $c1_1_9_i=$inc46_9_i;label=83;break;case 83:var $c1_1_9_i;var $s1_1_9_i;var $arrayidx42_10_i=$l3_side+10504+($ch*5252&-1)+4648|0;var $57=HEAP32[$arrayidx42_10_i>>2];var $cmp43_10_i=($57|0)==-1;if($cmp43_10_i){var $s1_1_10_i=$s1_1_9_i;var $c1_1_10_i=$c1_1_9_i;label=38;break}else{label=84;break};case 84:var $inc46_10_i=$c1_1_9_i+1|0;var $cmp49_10_i=($s1_1_9_i|0)<($57|0);var $_s1_0_10_i=$cmp49_10_i?$57:$s1_1_9_i;var $s1_1_10_i=$_s1_0_10_i;var $c1_1_10_i=$inc46_10_i;label=38;break;case 85:var $recalc_4;var $58=HEAP32[$sfbmax>>2];var $cmp12473=($58|0)>0;if($cmp12473){var $sfb_574=0;var $59=$58;label=86;break}else{label=89;break};case 86:var $59;var $sfb_574;var $arrayidx127=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4608+($sfb_574<<2)|0;var $60=HEAP32[$arrayidx127>>2];var $cmp128=($60|0)==-2;if($cmp128){label=87;break}else{var $61=$59;label=88;break};case 87:HEAP32[$arrayidx127>>2]=0;var $_pre91=HEAP32[$sfbmax>>2];var $61=$_pre91;label=88;break;case 88:var $61;var $inc134=$sfb_574+1|0;var $cmp124=($inc134|0)<($61|0);if($cmp124){var $sfb_574=$inc134;var $59=$61;label=86;break}else{label=89;break};case 89:var $tobool136=($recalc_4|0)==0;if($tobool136){label=91;break}else{label=90;break};case 90:var $call=_scale_bitcount($gfc,$arrayidx2);label=91;break;case 91:return;case 92:var $sfb_0_i_1;var $cmp8_i_1=($sfb_0_i_1|0)<($28|0);if($cmp8_i_1){label=93;break}else{label=94;break};case 93:var $arrayidx10_i_1=$l3_side+($ch*5252&-1)+4608+($sfb_0_i_1<<2)|0;var $62=HEAP32[$arrayidx10_i_1>>2];var $arrayidx12_i_1=$l3_side+10504+($ch*5252&-1)+4608+($sfb_0_i_1<<2)|0;var $63=HEAP32[$arrayidx12_i_1>>2];var $cmp13_i_1=($62|0)!=($63|0);var $cmp16_i_1=($63|0)>-1;var $or_cond_i_1=$cmp13_i_1&$cmp16_i_1;var $inc_i_1=$sfb_0_i_1+1|0;if($or_cond_i_1){label=94;break}else{var $sfb_0_i_1=$inc_i_1;label=92;break};case 94:var $cmp19_i_1=($sfb_0_i_1|0)==($28|0);if($cmp19_i_1){label=95;break}else{label=98;break};case 95:var $cmp2562_i_1=($25|0)<($28|0);if($cmp2562_i_1){label=96;break}else{label=97;break};case 96:var $scevgep65_i_1=$l3_side+10504+($ch*5252&-1)+4608+($25<<2)|0;var $scevgep6566_i_1=$scevgep65_i_1;var $64=$25+1|0;var $65=($28|0)>($64|0);var $smax_i_1=$65?$28:$64;var $66=$smax_i_1-$25|0;var $67=$66<<2;_memset($scevgep6566_i_1,-1,$67);label=97;break;case 97:var $arrayidx33_i_1=$l3_side+21024+($ch<<4)+4|0;HEAP32[$arrayidx33_i_1>>2]=1;label=98;break;case 98:var $68=HEAP32[9132>>2];var $sfb_0_i_2=$28;label=99;break;case 99:var $sfb_0_i_2;var $cmp8_i_2=($sfb_0_i_2|0)<($68|0);if($cmp8_i_2){label=100;break}else{label=101;break};case 100:var $arrayidx10_i_2=$l3_side+($ch*5252&-1)+4608+($sfb_0_i_2<<2)|0;var $69=HEAP32[$arrayidx10_i_2>>2];var $arrayidx12_i_2=$l3_side+10504+($ch*5252&-1)+4608+($sfb_0_i_2<<2)|0;var $70=HEAP32[$arrayidx12_i_2>>2];var $cmp13_i_2=($69|0)!=($70|0);var $cmp16_i_2=($70|0)>-1;var $or_cond_i_2=$cmp13_i_2&$cmp16_i_2;var $inc_i_2=$sfb_0_i_2+1|0;if($or_cond_i_2){label=101;break}else{var $sfb_0_i_2=$inc_i_2;label=99;break};case 101:var $cmp19_i_2=($sfb_0_i_2|0)==($68|0);if($cmp19_i_2){label=102;break}else{label=105;break};case 102:var $cmp2562_i_2=($28|0)<($68|0);if($cmp2562_i_2){label=103;break}else{label=104;break};case 103:var $scevgep65_i_2=$l3_side+10504+($ch*5252&-1)+4608+($28<<2)|0;var $scevgep6566_i_2=$scevgep65_i_2;var $71=$28+1|0;var $72=($68|0)>($71|0);var $smax_i_2=$72?$68:$71;var $73=$smax_i_2-$28|0;var $74=$73<<2;_memset($scevgep6566_i_2,-1,$74);label=104;break;case 104:var $arrayidx33_i_2=$l3_side+21024+($ch<<4)+8|0;HEAP32[$arrayidx33_i_2>>2]=1;label=105;break;case 105:var $75=HEAP32[9136>>2];var $sfb_0_i_3=$68;label=106;break;case 106:var $sfb_0_i_3;var $cmp8_i_3=($sfb_0_i_3|0)<($75|0);if($cmp8_i_3){label=107;break}else{label=108;break};case 107:var $arrayidx10_i_3=$l3_side+($ch*5252&-1)+4608+($sfb_0_i_3<<2)|0;var $76=HEAP32[$arrayidx10_i_3>>2];var $arrayidx12_i_3=$l3_side+10504+($ch*5252&-1)+4608+($sfb_0_i_3<<2)|0;var $77=HEAP32[$arrayidx12_i_3>>2];var $cmp13_i_3=($76|0)!=($77|0);var $cmp16_i_3=($77|0)>-1;var $or_cond_i_3=$cmp13_i_3&$cmp16_i_3;var $inc_i_3=$sfb_0_i_3+1|0;if($or_cond_i_3){label=108;break}else{var $sfb_0_i_3=$inc_i_3;label=106;break};case 108:var $cmp19_i_3=($sfb_0_i_3|0)==($75|0);if($cmp19_i_3){label=109;break}else{label=112;break};case 109:var $cmp2562_i_3=($68|0)<($75|0);if($cmp2562_i_3){label=110;break}else{label=111;break};case 110:var $scevgep65_i_3=$l3_side+10504+($ch*5252&-1)+4608+($68<<2)|0;var $scevgep6566_i_3=$scevgep65_i_3;var $78=$68+1|0;var $79=($75|0)>($78|0);var $smax_i_3=$79?$75:$78;var $80=$smax_i_3-$68|0;var $81=$80<<2;_memset($scevgep6566_i_3,-1,$81);label=111;break;case 111:var $arrayidx33_i_3=$l3_side+21024+($ch<<4)+12|0;HEAP32[$arrayidx33_i_3>>2]=1;label=112;break;case 112:var $scevgep_i=$l3_side+10504+($ch*5252&-1)+4608|0;var $82=HEAP32[$scevgep_i>>2];var $cmp43_i=($82|0)==-1;if($cmp43_i){var $s1_1_i=0;var $c1_1_i=0;label=40;break}else{label=39;break};case 113:var $83=HEAP32[9688>>2];var $sub_1=$19-$83|0;HEAP32[$arrayidx83_1>>2]=$sub_1;label=114;break;case 114:var $arrayidx83_2=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4660|0;var $84=HEAP32[$arrayidx83_2>>2];var $cmp84_2=($84|0)>0;if($cmp84_2){label=115;break}else{label=116;break};case 115:var $85=HEAP32[9692>>2];var $sub_2=$84-$85|0;HEAP32[$arrayidx83_2>>2]=$sub_2;label=116;break;case 116:var $arrayidx83_3=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4664|0;var $86=HEAP32[$arrayidx83_3>>2];var $cmp84_3=($86|0)>0;if($cmp84_3){label=117;break}else{label=118;break};case 117:var $87=HEAP32[9696>>2];var $sub_3=$86-$87|0;HEAP32[$arrayidx83_3>>2]=$sub_3;label=118;break;case 118:var $arrayidx83_4=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4668|0;var $88=HEAP32[$arrayidx83_4>>2];var $cmp84_4=($88|0)>0;if($cmp84_4){label=119;break}else{label=120;break};case 119:var $89=HEAP32[9700>>2];var $sub_4=$88-$89|0;HEAP32[$arrayidx83_4>>2]=$sub_4;label=120;break;case 120:var $arrayidx83_5=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4672|0;var $90=HEAP32[$arrayidx83_5>>2];var $cmp84_5=($90|0)>0;if($cmp84_5){label=121;break}else{label=122;break};case 121:var $91=HEAP32[9704>>2];var $sub_5=$90-$91|0;HEAP32[$arrayidx83_5>>2]=$sub_5;label=122;break;case 122:var $arrayidx83_6=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4676|0;var $92=HEAP32[$arrayidx83_6>>2];var $cmp84_6=($92|0)>0;if($cmp84_6){label=123;break}else{label=124;break};case 123:var $93=HEAP32[9708>>2];var $sub_6=$92-$93|0;HEAP32[$arrayidx83_6>>2]=$sub_6;label=124;break;case 124:var $arrayidx83_7=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4680|0;var $94=HEAP32[$arrayidx83_7>>2];var $cmp84_7=($94|0)>0;if($cmp84_7){label=125;break}else{label=126;break};case 125:var $95=HEAP32[9712>>2];var $sub_7=$94-$95|0;HEAP32[$arrayidx83_7>>2]=$sub_7;label=126;break;case 126:var $arrayidx83_8=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4684|0;var $96=HEAP32[$arrayidx83_8>>2];var $cmp84_8=($96|0)>0;if($cmp84_8){label=127;break}else{label=128;break};case 127:var $97=HEAP32[9716>>2];var $sub_8=$96-$97|0;HEAP32[$arrayidx83_8>>2]=$sub_8;label=128;break;case 128:var $arrayidx83_9=$l3_side+($gr*10504&-1)+($ch*5252&-1)+4688|0;var $98=HEAP32[$arrayidx83_9>>2];var $cmp84_9=($98|0)>0;if($cmp84_9){label=129;break}else{label=130;break};case 129:var $99=HEAP32[9720>>2];var $sub_9=$98-$99|0;HEAP32[$arrayidx83_9>>2]=$sub_9;label=130;break;case 130:HEAP32[$preflag>>2]=1;var $recalc_3=1;label=27;break}}function _scale_bitcount($gfc,$cod_info){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+16|0;label=1;while(1)switch(label){case 1:var $max_sfac_i=sp;var $mode_gr=$gfc+76|0;var $0=HEAP32[$mode_gr>>2];var $cmp=($0|0)==2;if($cmp){label=2;break}else{label=21;break};case 2:var $block_type_i=$cod_info+4788|0;var $1=HEAP32[$block_type_i>>2];var $cmp_i=($1|0)==2;if($cmp_i){label=3;break}else{label=4;break};case 3:var $mixed_block_flag_i=$cod_info+4792|0;var $2=HEAP32[$mixed_block_flag_i>>2];var $tobool_i=($2|0)==0;var $__i=$tobool_i?9144:9208;var $tab_0_i=$__i;label=9;break;case 4:var $preflag_i=$cod_info+4832|0;var $3=HEAP32[$preflag_i>>2];var $tobool3_i=($3|0)==0;if($tobool3_i){var $sfb_0_i=11;label=5;break}else{var $tab_0_i=9272;label=9;break};case 5:var $sfb_0_i;var $cmp5_i=($sfb_0_i|0)<21;if($cmp5_i){label=6;break}else{label=7;break};case 6:var $arrayidx_i=$cod_info+4608+($sfb_0_i<<2)|0;var $4=HEAP32[$arrayidx_i>>2];var $arrayidx6_i=9640+($sfb_0_i<<2)|0;var $5=HEAP32[$arrayidx6_i>>2];var $cmp7_i=($4|0)<($5|0);var $inc_i=$sfb_0_i+1|0;if($cmp7_i){label=7;break}else{var $sfb_0_i=$inc_i;label=5;break};case 7:var $cmp10_i=($sfb_0_i|0)==21;if($cmp10_i){label=8;break}else{var $tab_0_i=9272;label=9;break};case 8:HEAP32[$preflag_i>>2]=1;var $6=HEAP32[9684>>2];var $arrayidx17_i=$cod_info+4652|0;var $7=HEAP32[$arrayidx17_i>>2];var $sub_i=$7-$6|0;HEAP32[$arrayidx17_i>>2]=$sub_i;var $8=HEAP32[9688>>2];var $arrayidx17_1_i=$cod_info+4656|0;var $9=HEAP32[$arrayidx17_1_i>>2];var $sub_1_i=$9-$8|0;HEAP32[$arrayidx17_1_i>>2]=$sub_1_i;var $10=HEAP32[9692>>2];var $arrayidx17_2_i=$cod_info+4660|0;var $11=HEAP32[$arrayidx17_2_i>>2];var $sub_2_i=$11-$10|0;HEAP32[$arrayidx17_2_i>>2]=$sub_2_i;var $12=HEAP32[9696>>2];var $arrayidx17_3_i=$cod_info+4664|0;var $13=HEAP32[$arrayidx17_3_i>>2];var $sub_3_i=$13-$12|0;HEAP32[$arrayidx17_3_i>>2]=$sub_3_i;var $14=HEAP32[9700>>2];var $arrayidx17_4_i=$cod_info+4668|0;var $15=HEAP32[$arrayidx17_4_i>>2];var $sub_4_i=$15-$14|0;HEAP32[$arrayidx17_4_i>>2]=$sub_4_i;var $16=HEAP32[9704>>2];var $arrayidx17_5_i=$cod_info+4672|0;var $17=HEAP32[$arrayidx17_5_i>>2];var $sub_5_i=$17-$16|0;HEAP32[$arrayidx17_5_i>>2]=$sub_5_i;var $18=HEAP32[9708>>2];var $arrayidx17_6_i=$cod_info+4676|0;var $19=HEAP32[$arrayidx17_6_i>>2];var $sub_6_i=$19-$18|0;HEAP32[$arrayidx17_6_i>>2]=$sub_6_i;var $20=HEAP32[9712>>2];var $arrayidx17_7_i=$cod_info+4680|0;var $21=HEAP32[$arrayidx17_7_i>>2];var $sub_7_i=$21-$20|0;HEAP32[$arrayidx17_7_i>>2]=$sub_7_i;var $22=HEAP32[9716>>2];var $arrayidx17_8_i=$cod_info+4684|0;var $23=HEAP32[$arrayidx17_8_i>>2];var $sub_8_i=$23-$22|0;HEAP32[$arrayidx17_8_i>>2]=$sub_8_i;var $24=HEAP32[9720>>2];var $arrayidx17_9_i=$cod_info+4688|0;var $25=HEAP32[$arrayidx17_9_i>>2];var $sub_9_i=$25-$24|0;HEAP32[$arrayidx17_9_i>>2]=$sub_9_i;var $tab_0_i=9272;label=9;break;case 9:var $tab_0_i;var $sfbdivide_i=$cod_info+4868|0;var $26=HEAP32[$sfbdivide_i>>2];var $cmp255_i=($26|0)>0;if($cmp255_i){var $sfb_26_i=0;var $max_slen1_07_i=0;label=12;break}else{var $sfb_2_lcssa_i=0;var $max_slen1_0_lcssa_i=0;label=11;break};case 10:var $27=($26|0)>1;var $smax_i=$27?$26:1;var $sfb_2_lcssa_i=$smax_i;var $max_slen1_0_lcssa_i=$_max_slen1_0_i;label=11;break;case 11:var $max_slen1_0_lcssa_i;var $sfb_2_lcssa_i;var $sfbmax_i=$cod_info+4860|0;var $28=HEAP32[$sfbmax_i>>2];var $cmp362_i=($sfb_2_lcssa_i|0)<($28|0);if($cmp362_i){var $sfb_33_i=$sfb_2_lcssa_i;var $max_slen2_04_i=0;label=13;break}else{var $max_slen2_0_lcssa_i=0;label=14;break};case 12:var $max_slen1_07_i;var $sfb_26_i;var $arrayidx27_i=$cod_info+4608+($sfb_26_i<<2)|0;var $29=HEAP32[$arrayidx27_i>>2];var $cmp28_i=($max_slen1_07_i|0)<($29|0);var $_max_slen1_0_i=$cmp28_i?$29:$max_slen1_07_i;var $inc33_i=$sfb_26_i+1|0;var $cmp25_i=($inc33_i|0)<($26|0);if($cmp25_i){var $sfb_26_i=$inc33_i;var $max_slen1_07_i=$_max_slen1_0_i;label=12;break}else{label=10;break};case 13:var $max_slen2_04_i;var $sfb_33_i;var $arrayidx38_i=$cod_info+4608+($sfb_33_i<<2)|0;var $30=HEAP32[$arrayidx38_i>>2];var $cmp39_i=($max_slen2_04_i|0)<($30|0);var $_max_slen2_0_i=$cmp39_i?$30:$max_slen2_04_i;var $inc44_i=$sfb_33_i+1|0;var $cmp36_i=($inc44_i|0)<($28|0);if($cmp36_i){var $sfb_33_i=$inc44_i;var $max_slen2_04_i=$_max_slen2_0_i;label=13;break}else{var $max_slen2_0_lcssa_i=$_max_slen2_0_i;label=14;break};case 14:var $max_slen2_0_lcssa_i;var $part2_length_i=$cod_info+4844|0;HEAP32[$part2_length_i>>2]=1e5;var $scalefac_compress_i=$cod_info+4784|0;var $k_01_i=0;var $31=1e5;label=15;break;case 15:var $31;var $k_01_i;var $arrayidx49_i=7216+($k_01_i<<2)|0;var $32=HEAP32[$arrayidx49_i>>2];var $cmp50_i=($max_slen1_0_lcssa_i|0)<($32|0);if($cmp50_i){label=16;break}else{var $35=$31;label=19;break};case 16:var $arrayidx51_i=7088+($k_01_i<<2)|0;var $33=HEAP32[$arrayidx51_i>>2];var $cmp52_i=($max_slen2_0_lcssa_i|0)<($33|0);if($cmp52_i){label=17;break}else{var $35=$31;label=19;break};case 17:var $arrayidx55_i=$tab_0_i+($k_01_i<<2)|0;var $34=HEAP32[$arrayidx55_i>>2];var $cmp56_i=($31|0)>($34|0);if($cmp56_i){label=18;break}else{var $35=$31;label=19;break};case 18:HEAP32[$part2_length_i>>2]=$34;HEAP32[$scalefac_compress_i>>2]=$k_01_i;var $35=$34;label=19;break;case 19:var $35;var $inc62_i=$k_01_i+1|0;var $cmp47_i=($inc62_i|0)<16;if($cmp47_i){var $k_01_i=$inc62_i;var $31=$35;label=15;break}else{label=20;break};case 20:var $cmp65_i=($35|0)==1e5;var $conv_i=$cmp65_i&1;var $retval_0=$conv_i;label=61;break;case 21:var $36=$max_sfac_i;var $preflag_i2=$cod_info+4832|0;var $37=HEAP32[$preflag_i2>>2];var $tobool_i3=($37|0)==0;HEAP32[$36>>2]=0;HEAP32[$36+4>>2]=0;HEAP32[$36+8>>2]=0;HEAP32[$36+12>>2]=0;var $__i4=$tobool_i3?0:2;var $block_type_i5=$cod_info+4788|0;var $38=HEAP32[$block_type_i5>>2];var $cmp2_i=($38|0)==2;if($cmp2_i){var $sfb_09_i=0;var $partition_010_i=0;label=23;break}else{label=22;break};case 22:var $arrayidx43_i=10232+($__i4*48&-1)|0;var $39=HEAP32[$arrayidx43_i>>2];var $cmp4511_i=($39|0)>0;if($cmp4511_i){label=30;break}else{var $sfb_3_lcssa_i=0;var $50=0;label=34;break};case 23:var $partition_010_i;var $sfb_09_i;var $arrayidx10_i=10248+($__i4*48&-1)+($partition_010_i<<2)|0;var $40=HEAP32[$arrayidx10_i>>2];var $div_i=($40|0)/3&-1;var $cmp126_i=($40|0)>2;if($cmp126_i){label=24;break}else{var $sfb_1_lcssa_i=$sfb_09_i;label=29;break};case 24:var $arrayidx18_i=$max_sfac_i+($partition_010_i<<2)|0;var $41=($div_i|0)>1;var $_pre_i=HEAP32[$arrayidx18_i>>2];var $i_17_i=0;var $sfb_18_i=$sfb_09_i;var $42=$_pre_i;label=25;break;case 25:var $42;var $sfb_18_i;var $i_17_i;var $mul_i=$sfb_18_i*3&-1;var $arrayidx17_i7=$cod_info+4608+($mul_i<<2)|0;var $43=HEAP32[$arrayidx17_i7>>2];var $cmp19_i=($43|0)>($42|0);if($cmp19_i){label=26;break}else{var $44=$42;label=27;break};case 26:HEAP32[$arrayidx18_i>>2]=$43;var $44=$43;label=27;break;case 27:var $44;var $add_1_i=$mul_i+1|0;var $arrayidx17_1_i8=$cod_info+4608+($add_1_i<<2)|0;var $45=HEAP32[$arrayidx17_1_i8>>2];var $cmp19_1_i=($45|0)>($44|0);if($cmp19_1_i){label=41;break}else{var $68=$44;label=42;break};case 28:var $smax_i6=$41?$div_i:1;var $46=$smax_i6+$sfb_09_i|0;var $sfb_1_lcssa_i=$46;label=29;break;case 29:var $sfb_1_lcssa_i;var $inc34_i=$partition_010_i+1|0;var $cmp8_i=($inc34_i|0)<4;if($cmp8_i){var $sfb_09_i=$sfb_1_lcssa_i;var $partition_010_i=$inc34_i;label=23;break}else{label=35;break};case 30:var $arrayidx48_i=$max_sfac_i|0;var $sfb_313_i=0;var $47=0;label=31;break;case 31:var $47;var $sfb_313_i;var $arrayidx47_i=$cod_info+4608+($sfb_313_i<<2)|0;var $48=HEAP32[$arrayidx47_i>>2];var $cmp49_i=($48|0)>($47|0);if($cmp49_i){label=32;break}else{var $49=$47;label=33;break};case 32:HEAP32[$arrayidx48_i>>2]=$48;var $49=$48;label=33;break;case 33:var $49;var $inc56_i=$sfb_313_i+1|0;var $cmp45_i=($inc56_i|0)<($39|0);if($cmp45_i){var $sfb_313_i=$inc56_i;var $47=$49;label=31;break}else{var $sfb_3_lcssa_i=$39;var $50=$49;label=34;break};case 34:var $50;var $sfb_3_lcssa_i;var $arrayidx43_1_i=10236+($__i4*48&-1)|0;var $51=HEAP32[$arrayidx43_1_i>>2];var $cmp4511_1_i=($51|0)>0;if($cmp4511_1_i){label=45;break}else{var $sfb_3_lcssa_1_i=$sfb_3_lcssa_i;var $75=0;label=50;break};case 35:var $arrayidx65_phi_trans_insert_i=$max_sfac_i|0;var $_pre20_i=HEAP32[$arrayidx65_phi_trans_insert_i>>2];var $arrayidx65_1_phi_trans_insert_i=$max_sfac_i+4|0;var $_pre21_i=HEAP32[$arrayidx65_1_phi_trans_insert_i>>2];var $arrayidx65_2_phi_trans_insert_i=$max_sfac_i+8|0;var $_pre22_i=HEAP32[$arrayidx65_2_phi_trans_insert_i>>2];var $arrayidx65_3_phi_trans_insert_i=$max_sfac_i+12|0;var $_pre23_i=HEAP32[$arrayidx65_3_phi_trans_insert_i>>2];var $row_in_table_0_i=1;var $55=$_pre20_i;var $54=$_pre21_i;var $53=$_pre22_i;var $52=$_pre23_i;label=36;break;case 36:var $52;var $53;var $54;var $55;var $row_in_table_0_i;var $arrayidx67_i=10752+($__i4<<4)|0;var $56=HEAP32[$arrayidx67_i>>2];var $cmp68_i=($55|0)>($56|0);var $inc70_i=$cmp68_i&1;var $arrayidx67_1_i=10756+($__i4<<4)|0;var $57=HEAP32[$arrayidx67_1_i>>2];var $cmp68_1_i=($54|0)>($57|0);var $inc70_1_i=$cmp68_1_i&1;var $inc70_over_0_1_i=$inc70_1_i+$inc70_i|0;var $arrayidx67_2_i=10760+($__i4<<4)|0;var $58=HEAP32[$arrayidx67_2_i>>2];var $cmp68_2_i=($53|0)>($58|0);var $inc70_2_i=$cmp68_2_i&1;var $inc70_over_0_2_i=$inc70_over_0_1_i+$inc70_2_i|0;var $arrayidx67_3_i=10764+($__i4<<4)|0;var $59=HEAP32[$arrayidx67_3_i>>2];var $cmp68_3_i=($52|0)>($59|0);var $inc70_3_i=$cmp68_3_i&1;var $inc70_over_0_3_i=$inc70_over_0_2_i+$inc70_3_i|0;var $tobool75_i=($inc70_over_0_3_i|0)==0;if($tobool75_i){label=37;break}else{var $retval_0=$inc70_over_0_3_i;label=61;break};case 37:var $arraydecay79_i=10232+($__i4*48&-1)+($row_in_table_0_i<<4)|0;var $sfb_partition_table_i=$cod_info+5188|0;HEAP32[$sfb_partition_table_i>>2]=$arraydecay79_i;var $arrayidx84_i=10648+($55<<2)|0;var $60=HEAP32[$arrayidx84_i>>2];var $arrayidx85_i=$cod_info+5192|0;HEAP32[$arrayidx85_i>>2]=$60;var $arrayidx84_1_i=10648+($54<<2)|0;var $61=HEAP32[$arrayidx84_1_i>>2];var $arrayidx85_1_i=$cod_info+5196|0;HEAP32[$arrayidx85_1_i>>2]=$61;var $arrayidx84_2_i=10648+($53<<2)|0;var $62=HEAP32[$arrayidx84_2_i>>2];var $arrayidx85_2_i=$cod_info+5200|0;HEAP32[$arrayidx85_2_i>>2]=$62;var $arrayidx84_3_i=10648+($52<<2)|0;var $63=HEAP32[$arrayidx84_3_i>>2];var $arrayidx85_3_i=$cod_info+5204|0;HEAP32[$arrayidx85_3_i>>2]=$63;if($tobool_i3){label=38;break}else{label=39;break};case 38:var $mul97_i=$60*5&-1;var $add98_i=$mul97_i+$61|0;var $shl_i=$add98_i<<4;var $shl99_i=$62<<2;var $add100_i=$shl99_i+$shl_i|0;var $add101_i=$add100_i+$63|0;var $scalefac_compress_i9=$cod_info+4784|0;HEAP32[$scalefac_compress_i9>>2]=$add101_i;label=40;break;case 39:var $mul110_i=$60*3&-1;var $add111_i=$mul110_i+500|0;var $add112_i=$add111_i+$61|0;var $scalefac_compress113_i=$cod_info+4784|0;HEAP32[$scalefac_compress113_i>>2]=$add112_i;label=40;break;case 40:var $part2_length_i10=$cod_info+4844|0;var $64=HEAP32[$arraydecay79_i>>2];var $mul124_i=Math.imul($64,$60)|0;var $arrayidx123_1_i=10232+($__i4*48&-1)+($row_in_table_0_i<<4)+4|0;var $65=HEAP32[$arrayidx123_1_i>>2];var $mul124_1_i=Math.imul($65,$61)|0;var $add126_1_i=$mul124_1_i+$mul124_i|0;var $arrayidx123_2_i=10232+($__i4*48&-1)+($row_in_table_0_i<<4)+8|0;var $66=HEAP32[$arrayidx123_2_i>>2];var $mul124_2_i=Math.imul($66,$62)|0;var $add126_2_i=$add126_1_i+$mul124_2_i|0;var $arrayidx123_3_i=10232+($__i4*48&-1)+($row_in_table_0_i<<4)+12|0;var $67=HEAP32[$arrayidx123_3_i>>2];var $mul124_3_i=Math.imul($67,$63)|0;var $add126_3_i=$add126_2_i+$mul124_3_i|0;HEAP32[$part2_length_i10>>2]=$add126_3_i;var $retval_0=0;label=61;break;case 41:HEAP32[$arrayidx18_i>>2]=$45;var $68=$45;label=42;break;case 42:var $68;var $add_2_i=$mul_i+2|0;var $arrayidx17_2_i11=$cod_info+4608+($add_2_i<<2)|0;var $69=HEAP32[$arrayidx17_2_i11>>2];var $cmp19_2_i=($69|0)>($68|0);if($cmp19_2_i){label=43;break}else{var $70=$68;label=44;break};case 43:HEAP32[$arrayidx18_i>>2]=$69;var $70=$69;label=44;break;case 44:var $70;var $inc30_i=$i_17_i+1|0;var $inc31_i=$sfb_18_i+1|0;var $cmp12_i=($inc30_i|0)<($div_i|0);if($cmp12_i){var $i_17_i=$inc30_i;var $sfb_18_i=$inc31_i;var $42=$70;label=25;break}else{label=28;break};case 45:var $arrayidx48_1_i=$max_sfac_i+4|0;var $i_212_1_i=0;var $sfb_313_1_i=$sfb_3_lcssa_i;var $71=0;label=46;break;case 46:var $71;var $sfb_313_1_i;var $i_212_1_i;var $arrayidx47_1_i=$cod_info+4608+($sfb_313_1_i<<2)|0;var $72=HEAP32[$arrayidx47_1_i>>2];var $cmp49_1_i=($72|0)>($71|0);if($cmp49_1_i){label=47;break}else{var $73=$71;label=48;break};case 47:HEAP32[$arrayidx48_1_i>>2]=$72;var $73=$72;label=48;break;case 48:var $73;var $inc55_1_i=$i_212_1_i+1|0;var $inc56_1_i=$sfb_313_1_i+1|0;var $cmp45_1_i=($inc55_1_i|0)<($51|0);if($cmp45_1_i){var $i_212_1_i=$inc55_1_i;var $sfb_313_1_i=$inc56_1_i;var $71=$73;label=46;break}else{label=49;break};case 49:var $74=$51+$sfb_3_lcssa_i|0;var $sfb_3_lcssa_1_i=$74;var $75=$73;label=50;break;case 50:var $75;var $sfb_3_lcssa_1_i;var $arrayidx43_2_i=10240+($__i4*48&-1)|0;var $76=HEAP32[$arrayidx43_2_i>>2];var $cmp4511_2_i=($76|0)>0;if($cmp4511_2_i){label=51;break}else{var $sfb_3_lcssa_2_i=$sfb_3_lcssa_1_i;var $81=0;label=56;break};case 51:var $arrayidx48_2_i=$max_sfac_i+8|0;var $i_212_2_i=0;var $sfb_313_2_i=$sfb_3_lcssa_1_i;var $77=0;label=52;break;case 52:var $77;var $sfb_313_2_i;var $i_212_2_i;var $arrayidx47_2_i=$cod_info+4608+($sfb_313_2_i<<2)|0;var $78=HEAP32[$arrayidx47_2_i>>2];var $cmp49_2_i=($78|0)>($77|0);if($cmp49_2_i){label=53;break}else{var $79=$77;label=54;break};case 53:HEAP32[$arrayidx48_2_i>>2]=$78;var $79=$78;label=54;break;case 54:var $79;var $inc55_2_i=$i_212_2_i+1|0;var $inc56_2_i=$sfb_313_2_i+1|0;var $cmp45_2_i=($inc55_2_i|0)<($76|0);if($cmp45_2_i){var $i_212_2_i=$inc55_2_i;var $sfb_313_2_i=$inc56_2_i;var $77=$79;label=52;break}else{label=55;break};case 55:var $80=$76+$sfb_3_lcssa_1_i|0;var $sfb_3_lcssa_2_i=$80;var $81=$79;label=56;break;case 56:var $81;var $sfb_3_lcssa_2_i;var $arrayidx43_3_i=10244+($__i4*48&-1)|0;var $82=HEAP32[$arrayidx43_3_i>>2];var $cmp4511_3_i=($82|0)>0;if($cmp4511_3_i){label=57;break}else{var $row_in_table_0_i=0;var $55=$50;var $54=$75;var $53=$81;var $52=0;label=36;break};case 57:var $arrayidx48_3_i=$max_sfac_i+12|0;var $i_212_3_i=0;var $sfb_313_3_i=$sfb_3_lcssa_2_i;var $83=0;label=58;break;case 58:var $83;var $sfb_313_3_i;var $i_212_3_i;var $arrayidx47_3_i=$cod_info+4608+($sfb_313_3_i<<2)|0;var $84=HEAP32[$arrayidx47_3_i>>2];var $cmp49_3_i=($84|0)>($83|0);if($cmp49_3_i){label=59;break}else{var $85=$83;label=60;break};case 59:HEAP32[$arrayidx48_3_i>>2]=$84;var $85=$84;label=60;break;case 60:var $85;var $inc55_3_i=$i_212_3_i+1|0;var $inc56_3_i=$sfb_313_3_i+1|0;var $cmp45_3_i=($inc55_3_i|0)<($82|0);if($cmp45_3_i){var $i_212_3_i=$inc55_3_i;var $sfb_313_3_i=$inc56_3_i;var $83=$85;label=58;break}else{var $row_in_table_0_i=0;var $55=$50;var $54=$75;var $53=$81;var $52=$85;label=36;break};case 61:var $retval_0;STACKTOP=sp;return $retval_0}}function _huffman_init($gfc){var label=0;label=1;while(1)switch(label){case 1:var $choose_table=$gfc+85816|0;HEAP32[$choose_table>>2]=48;var $i_026=2;label=2;break;case 2:var $i_026;var $scfb_anz_0=0;label=3;break;case 3:var $scfb_anz_0;var $inc=$scfb_anz_0+1|0;var $arrayidx=$gfc+21360+($inc<<2)|0;var $0=HEAP32[$arrayidx>>2];var $cmp1=($0|0)<($i_026|0);if($cmp1){var $scfb_anz_0=$inc;label=3;break}else{label=4;break};case 4:var $region0_count=6840+($inc<<3)|0;var $1=HEAP32[$region0_count>>2];var $bv_index_0=$1;label=5;break;case 5:var $bv_index_0;var $add=$bv_index_0+1|0;var $arrayidx6=$gfc+21360+($add<<2)|0;var $2=HEAP32[$arrayidx6>>2];var $cmp7=($2|0)>($i_026|0);var $dec=$bv_index_0-1|0;if($cmp7){var $bv_index_0=$dec;label=5;break}else{label=6;break};case 6:var $cmp10=($bv_index_0|0)<0;var $extract_t_extract_t23_v=$cmp10?$1:$bv_index_0;var $extract_t_extract_t23=$extract_t_extract_t23_v&255;var $sub=$i_026-2|0;var $arrayidx13=$sub+($gfc+85100)|0;HEAP8[$arrayidx13]=$extract_t_extract_t23;var $region1_count=6844+($inc<<3)|0;var $3=HEAP32[$region1_count>>2];var $conv20=$extract_t_extract_t23<<24>>24;var $bv_index_2=$3;label=7;break;case 7:var $bv_index_2;var $add21=$bv_index_2+2|0;var $add22=$add21+$conv20|0;var $arrayidx25=$gfc+21360+($add22<<2)|0;var $4=HEAP32[$arrayidx25>>2];var $cmp26=($4|0)>($i_026|0);var $dec29=$bv_index_2-1|0;if($cmp26){var $bv_index_2=$dec29;label=7;break}else{label=8;break};case 8:var $cmp31=($bv_index_2|0)<0;var $extract_t24_extract_t25_v=$cmp31?$3:$bv_index_2;var $extract_t24_extract_t25=$extract_t24_extract_t25_v&255;var $sub38=$i_026-1|0;var $arrayidx41=$sub38+($gfc+85100)|0;HEAP8[$arrayidx41]=$extract_t24_extract_t25;var $add42=$i_026+2|0;var $cmp=($add42|0)<577;if($cmp){var $i_026=$add42;label=2;break}else{label=9;break};case 9:return}}function _choose_table_nonMMX($ix,$end,$_s){var label=0;label=1;while(1)switch(label){case 1:var $ix_addr_0_i=$ix;var $max1_0_i=0;var $max2_0_i=0;label=2;break;case 2:var $max2_0_i;var $max1_0_i;var $ix_addr_0_i;var $incdec_ptr_i=$ix_addr_0_i+4|0;var $0=HEAP32[$ix_addr_0_i>>2];var $incdec_ptr1_i=$ix_addr_0_i+8|0;var $1=HEAP32[$incdec_ptr_i>>2];var $cmp_i=($max1_0_i|0)<($0|0);var $_max1_0_i=$cmp_i?$0:$max1_0_i;var $cmp2_i=($max2_0_i|0)<($1|0);var $max2_1_i=$cmp2_i?$1:$max2_0_i;var $cmp5_i=$incdec_ptr1_i>>>0<$end>>>0;if($cmp5_i){var $ix_addr_0_i=$incdec_ptr1_i;var $max1_0_i=$_max1_0_i;var $max2_0_i=$max2_1_i;label=2;break}else{label=3;break};case 3:var $cmp6_i=($_max1_0_i|0)<($max2_1_i|0);var $max2_1__max1_0_i=$cmp6_i?$max2_1_i:$_max1_0_i;var $cmp=$max2_1__max1_0_i>>>0<16;if($cmp){label=4;break}else{label=5;break};case 4:var $arrayidx=16392+($max2_1__max1_0_i<<2)|0;var $2=HEAP32[$arrayidx>>2];var $call1=FUNCTION_TABLE[$2]($ix,$end,$max2_1__max1_0_i,$_s);var $retval_0=$call1;label=16;break;case 5:var $cmp2=$max2_1__max1_0_i>>>0>8206;if($cmp2){label=6;break}else{label=7;break};case 6:HEAP32[$_s>>2]=1e5;var $retval_0=-1;label=16;break;case 7:var $sub=$max2_1__max1_0_i-15|0;var $choice2_0=24;label=8;break;case 8:var $choice2_0;var $cmp5=($choice2_0|0)<32;if($cmp5){label=9;break}else{label=10;break};case 9:var $linmax=12460+($choice2_0<<4)|0;var $3=HEAP32[$linmax>>2];var $cmp7=$3>>>0<$sub>>>0;var $inc=$choice2_0+1|0;if($cmp7){var $choice2_0=$inc;label=8;break}else{label=10;break};case 10:var $sub10=$choice2_0-8|0;var $choice_0=$sub10;label=11;break;case 11:var $choice_0;var $cmp12=($choice_0|0)<24;if($cmp12){label=12;break}else{label=13;break};case 12:var $linmax15=12460+($choice_0<<4)|0;var $4=HEAP32[$linmax15>>2];var $cmp16=$4>>>0<$sub>>>0;var $inc20=$choice_0+1|0;if($cmp16){var $choice_0=$inc20;label=11;break}else{label=13;break};case 13:var $xlen_i=12456+($choice_0<<4)|0;var $5=HEAP32[$xlen_i>>2];var $mul_i=$5<<16;var $xlen2_i=12456+($choice2_0<<4)|0;var $6=HEAP32[$xlen2_i>>2];var $add_i=$mul_i+$6|0;var $ix_addr_0_i19=$ix;var $sum_0_i=0;label=14;break;case 14:var $sum_0_i;var $ix_addr_0_i19;var $incdec_ptr_i20=$ix_addr_0_i19+4|0;var $7=HEAP32[$ix_addr_0_i19>>2];var $incdec_ptr3_i=$ix_addr_0_i19+8|0;var $8=HEAP32[$incdec_ptr_i20>>2];var $cmp_i21=$7>>>0>14;var $add4_i=$cmp_i21?$add_i:0;var $sum_1_i=$add4_i+$sum_0_i|0;var $cmp5_i22=$8>>>0>14;var $add7_i=$cmp5_i22?$add_i:0;var $__i=$cmp5_i22?15:$8;var $_op_i=$7<<4;var $shl_i=$cmp_i21?240:$_op_i;var $add9_i=$__i+$shl_i|0;var $arrayidx10_i=10912+($add9_i<<2)|0;var $9=HEAP32[$arrayidx10_i>>2];var $add7_sum_1_i=$sum_1_i+$9|0;var $add11_i=$add7_sum_1_i+$add7_i|0;var $cmp12_i=$incdec_ptr3_i>>>0<$end>>>0;if($cmp12_i){var $ix_addr_0_i19=$incdec_ptr3_i;var $sum_0_i=$add11_i;label=14;break}else{label=15;break};case 15:var $and_i=$add11_i&65535;var $shr_i=$add11_i>>>16;var $cmp13_i=$shr_i>>>0>$and_i>>>0;var $t2_t1_i=$cmp13_i?$choice2_0:$choice_0;var $and_shr_i=$cmp13_i?$and_i:$shr_i;var $10=HEAP32[$_s>>2];var $add16_i=$10+$and_shr_i|0;HEAP32[$_s>>2]=$add16_i;var $retval_0=$t2_t1_i;label=16;break;case 16:var $retval_0;return $retval_0}}function _count_bit_null($ix,$end,$max,$s){return 0}function _count_bit_noESC($ix,$end,$mx,$s){var label=0;label=1;while(1)switch(label){case 1:var $0=HEAP32[12484>>2];var $ix_addr_0=$ix;var $sum1_0=0;label=2;break;case 2:var $sum1_0;var $ix_addr_0;var $incdec_ptr=$ix_addr_0+4|0;var $1=HEAP32[$ix_addr_0>>2];var $incdec_ptr1=$ix_addr_0+8|0;var $2=HEAP32[$incdec_ptr>>2];var $add=$1<<1;var $add2=$add+$2|0;var $arrayidx=$0+$add2|0;var $3=HEAP8[$arrayidx];var $conv=$3&255;var $add3=$conv+$sum1_0|0;var $cmp=$incdec_ptr1>>>0<$end>>>0;if($cmp){var $ix_addr_0=$incdec_ptr1;var $sum1_0=$add3;label=2;break}else{label=3;break};case 3:var $4=HEAP32[$s>>2];var $add5=$4+$add3|0;HEAP32[$s>>2]=$add5;return 1}}function _count_bit_noESC_from2($ix,$end,$max,$s){var label=0;label=1;while(1)switch(label){case 1:var $sub=$max-1|0;var $arrayidx=12392+($sub<<2)|0;var $0=HEAP32[$arrayidx>>2];var $xlen2=12456+($0<<4)|0;var $1=HEAP32[$xlen2>>2];var $cmp=($sub|0)==1;var $cond=$cmp?2192:2128;var $ix_addr_0=$ix;var $sum_0=0;label=2;break;case 2:var $sum_0;var $ix_addr_0;var $incdec_ptr=$ix_addr_0+4|0;var $2=HEAP32[$ix_addr_0>>2];var $incdec_ptr3=$ix_addr_0+8|0;var $3=HEAP32[$incdec_ptr>>2];var $mul=Math.imul($2,$1)|0;var $add=$mul+$3|0;var $arrayidx4=$cond+($add<<2)|0;var $4=HEAP32[$arrayidx4>>2];var $add5=$4+$sum_0|0;var $cmp6=$incdec_ptr3>>>0<$end>>>0;if($cmp6){var $ix_addr_0=$incdec_ptr3;var $sum_0=$add5;label=2;break}else{label=3;break};case 3:var $and=$add5&65535;var $shr=$add5>>>16;var $cmp7=$shr>>>0>$and>>>0;var $and_shr=$cmp7?$and:$shr;var $inc=$cmp7&1;var $inc_=$inc+$0|0;var $5=HEAP32[$s>>2];var $add8=$5+$and_shr|0;HEAP32[$s>>2]=$add8;return $inc_}}function _count_bit_noESC_from3($ix,$end,$max,$s){var label=0;label=1;while(1)switch(label){case 1:var $sub=$max-1|0;var $arrayidx=12392+($sub<<2)|0;var $0=HEAP32[$arrayidx>>2];var $xlen2=12456+($0<<4)|0;var $1=HEAP32[$xlen2>>2];var $hlen=12468+($0<<4)|0;var $2=HEAP32[$hlen>>2];var $add=$0+1|0;var $hlen5=12468+($add<<4)|0;var $3=HEAP32[$hlen5>>2];var $add6=$0+2|0;var $hlen8=12468+($add6<<4)|0;var $4=HEAP32[$hlen8>>2];var $ix_addr_0=$ix;var $sum1_0=0;var $sum2_0=0;var $sum3_0=0;label=2;break;case 2:var $sum3_0;var $sum2_0;var $sum1_0;var $ix_addr_0;var $incdec_ptr=$ix_addr_0+4|0;var $5=HEAP32[$ix_addr_0>>2];var $incdec_ptr9=$ix_addr_0+8|0;var $6=HEAP32[$incdec_ptr>>2];var $mul=Math.imul($5,$1)|0;var $add10=$mul+$6|0;var $arrayidx11=$2+$add10|0;var $7=HEAP8[$arrayidx11];var $conv=$7&255;var $add12=$conv+$sum1_0|0;var $arrayidx13=$3+$add10|0;var $8=HEAP8[$arrayidx13];var $conv14=$8&255;var $add15=$conv14+$sum2_0|0;var $arrayidx16=$4+$add10|0;var $9=HEAP8[$arrayidx16];var $conv17=$9&255;var $add18=$conv17+$sum3_0|0;var $cmp=$incdec_ptr9>>>0<$end>>>0;if($cmp){var $ix_addr_0=$incdec_ptr9;var $sum1_0=$add12;var $sum2_0=$add15;var $sum3_0=$add18;label=2;break}else{label=3;break};case 3:var $cmp20=$add12>>>0>$add15>>>0;var $add_=$cmp20?$add:$0;var $add15_add12=$cmp20?$add15:$add12;var $cmp22=$add15_add12>>>0>$add18>>>0;var $t_1=$cmp22?$add6:$add_;var $sum1_2=$cmp22?$add18:$add15_add12;var $10=HEAP32[$s>>2];var $add27=$10+$sum1_2|0;HEAP32[$s>>2]=$add27;return $t_1}}function _quantize_lines_xrpow($l,$istep,$xp,$pi){var label=0;label=1;while(1)switch(label){case 1:var $0=$pi;var $rem=$l&2;var $shr1=$l>>>2;var $tobool51=($shr1|0)==0;if($tobool51){var $fi_0_lcssa=$0;var $xp_addr_0_lcssa=$xp;label=5;break}else{label=2;break};case 2:var $1=$shr1<<2;var $scevgep56=$pi+($1<<2)|0;var $fi_052=$0;var $xp_addr_053=$xp;var $l_addr_054=$shr1;label=3;break;case 3:var $l_addr_054;var $xp_addr_053;var $fi_052;var $dec=$l_addr_054-1|0;var $2=HEAPF32[$xp_addr_053>>2];var $mul=$2*$istep;var $conv=$mul;var $arrayidx2=$xp_addr_053+4|0;var $3=HEAPF32[$arrayidx2>>2];var $mul3=$3*$istep;var $conv4=$mul3;var $arrayidx5=$xp_addr_053+8|0;var $4=HEAPF32[$arrayidx5>>2];var $mul6=$4*$istep;var $conv7=$mul6;var $arrayidx8=$xp_addr_053+12|0;var $5=HEAPF32[$arrayidx8>>2];var $mul9=$5*$istep;var $conv10=$mul9;var $add=$conv+8388608;var $conv11=$add;var $f=$fi_052|0;HEAPF32[$f>>2]=$conv11;var $add13=$conv4+8388608;var $conv14=$add13;var $arrayidx15=$fi_052+4|0;var $f16=$arrayidx15|0;HEAPF32[$f16>>2]=$conv14;var $add17=$conv7+8388608;var $conv18=$add17;var $arrayidx19=$fi_052+8|0;var $f20=$arrayidx19|0;HEAPF32[$f20>>2]=$conv18;var $add21=$conv10+8388608;var $conv22=$add21;var $arrayidx23=$fi_052+12|0;var $f24=$arrayidx23|0;HEAPF32[$f24>>2]=$conv22;var $i=$fi_052;var $6=(HEAPF32[tempDoublePtr>>2]=$conv11,HEAP32[tempDoublePtr>>2]);var $sub=$6-1258291200|0;var $arrayidx26=113864+($sub<<2)|0;var $7=HEAPF32[$arrayidx26>>2];var $conv27=$7;var $add28=$add+$conv27;var $conv29=$add28;HEAPF32[$f>>2]=$conv29;var $i33=$arrayidx15;var $8=(HEAPF32[tempDoublePtr>>2]=$conv14,HEAP32[tempDoublePtr>>2]);var $sub34=$8-1258291200|0;var $arrayidx35=113864+($sub34<<2)|0;var $9=HEAPF32[$arrayidx35>>2];var $conv36=$9;var $add37=$add13+$conv36;var $conv38=$add37;HEAPF32[$f16>>2]=$conv38;var $i42=$arrayidx19;var $10=(HEAPF32[tempDoublePtr>>2]=$conv18,HEAP32[tempDoublePtr>>2]);var $sub43=$10-1258291200|0;var $arrayidx44=113864+($sub43<<2)|0;var $11=HEAPF32[$arrayidx44>>2];var $conv45=$11;var $add46=$add17+$conv45;var $conv47=$add46;HEAPF32[$f20>>2]=$conv47;var $i51=$arrayidx23;var $12=(HEAPF32[tempDoublePtr>>2]=$conv22,HEAP32[tempDoublePtr>>2]);var $sub52=$12-1258291200|0;var $arrayidx53=113864+($sub52<<2)|0;var $13=HEAPF32[$arrayidx53>>2];var $conv54=$13;var $add55=$add21+$conv54;var $conv56=$add55;var $14=(HEAPF32[tempDoublePtr>>2]=$conv29,HEAP32[tempDoublePtr>>2]);var $sub61=$14-1258291200|0;HEAP32[$i>>2]=$sub61;var $15=(HEAPF32[tempDoublePtr>>2]=$conv38,HEAP32[tempDoublePtr>>2]);var $sub64=$15-1258291200|0;HEAP32[$i33>>2]=$sub64;var $16=(HEAPF32[tempDoublePtr>>2]=$conv47,HEAP32[tempDoublePtr>>2]);var $sub67=$16-1258291200|0;HEAP32[$i42>>2]=$sub67;var $17=(HEAPF32[tempDoublePtr>>2]=$conv56,HEAP32[tempDoublePtr>>2]);var $sub70=$17-1258291200|0;HEAP32[$i51>>2]=$sub70;var $add_ptr=$fi_052+16|0;var $add_ptr71=$xp_addr_053+16|0;var $tobool=($dec|0)==0;if($tobool){label=4;break}else{var $fi_052=$add_ptr;var $xp_addr_053=$add_ptr71;var $l_addr_054=$dec;label=3;break};case 4:var $scevgep=$xp+($1<<2)|0;var $scevgep5657=$scevgep56;var $fi_0_lcssa=$scevgep5657;var $xp_addr_0_lcssa=$scevgep;label=5;break;case 5:var $xp_addr_0_lcssa;var $fi_0_lcssa;var $tobool72=($rem|0)==0;if($tobool72){label=7;break}else{label=6;break};case 6:var $18=HEAPF32[$xp_addr_0_lcssa>>2];var $mul75=$18*$istep;var $conv76=$mul75;var $arrayidx78=$xp_addr_0_lcssa+4|0;var $19=HEAPF32[$arrayidx78>>2];var $mul79=$19*$istep;var $conv80=$mul79;var $add81=$conv76+8388608;var $conv82=$add81;var $f84=$fi_0_lcssa|0;HEAPF32[$f84>>2]=$conv82;var $add85=$conv80+8388608;var $conv86=$add85;var $arrayidx87=$fi_0_lcssa+4|0;var $f88=$arrayidx87|0;HEAPF32[$f88>>2]=$conv86;var $i90=$fi_0_lcssa;var $20=(HEAPF32[tempDoublePtr>>2]=$conv82,HEAP32[tempDoublePtr>>2]);var $sub91=$20-1258291200|0;var $arrayidx92=113864+($sub91<<2)|0;var $21=HEAPF32[$arrayidx92>>2];var $conv93=$21;var $add94=$add81+$conv93;var $conv95=$add94;HEAPF32[$f84>>2]=$conv95;var $i99=$arrayidx87;var $22=(HEAPF32[tempDoublePtr>>2]=$conv86,HEAP32[tempDoublePtr>>2]);var $sub100=$22-1258291200|0;var $arrayidx101=113864+($sub100<<2)|0;var $23=HEAPF32[$arrayidx101>>2];var $conv102=$23;var $add103=$add85+$conv102;var $conv104=$add103;var $24=(HEAPF32[tempDoublePtr>>2]=$conv95,HEAP32[tempDoublePtr>>2]);var $sub109=$24-1258291200|0;HEAP32[$i90>>2]=$sub109;var $25=(HEAPF32[tempDoublePtr>>2]=$conv104,HEAP32[tempDoublePtr>>2]);var $sub112=$25-1258291200|0;HEAP32[$i99>>2]=$sub112;label=7;break;case 7:return}}function _free_id3tag($gfc){var label=0;label=1;while(1)switch(label){case 1:var $title=$gfc+85704|0;var $0=HEAP32[$title>>2];var $cmp=($0|0)==0;if($cmp){label=3;break}else{label=2;break};case 2:_free($0);HEAP32[$title>>2]=0;label=3;break;case 3:var $artist=$gfc+85708|0;var $1=HEAP32[$artist>>2];var $cmp6=($1|0)==0;if($cmp6){label=5;break}else{label=4;break};case 4:_free($1);HEAP32[$artist>>2]=0;label=5;break;case 5:var $album=$gfc+85712|0;var $2=HEAP32[$album>>2];var $cmp14=($2|0)==0;if($cmp14){label=7;break}else{label=6;break};case 6:_free($2);HEAP32[$album>>2]=0;label=7;break;case 7:var $comment=$gfc+85716|0;var $3=HEAP32[$comment>>2];var $cmp22=($3|0)==0;if($cmp22){label=9;break}else{label=8;break};case 8:_free($3);HEAP32[$comment>>2]=0;label=9;break;case 9:var $albumart=$gfc+85728|0;var $4=HEAP32[$albumart>>2];var $cmp30=($4|0)==0;if($cmp30){label=11;break}else{label=10;break};case 10:_free($4);HEAP32[$albumart>>2]=0;var $albumart_size=$gfc+85732|0;HEAP32[$albumart_size>>2]=0;var $albumart_mimetype=$gfc+85740|0;HEAP32[$albumart_mimetype>>2]=0;label=11;break;case 11:var $v2_head=$gfc+85744|0;var $5=HEAP32[$v2_head>>2];var $cmp40=($5|0)==0;if($cmp40){label=14;break}else{var $node_0=$5;label=12;break};case 12:var $node_0;var $b=$node_0+12|0;var $6=HEAP32[$b>>2];var $b45=$node_0+24|0;var $7=HEAP32[$b45>>2];var $8=$node_0;var $nxt=$node_0|0;var $9=HEAP32[$nxt>>2];_free($6);_free($7);_free($8);var $cmp46=($9|0)==0;if($cmp46){label=13;break}else{var $node_0=$9;label=12;break};case 13:HEAP32[$v2_head>>2]=0;var $v2_tail=$gfc+85748|0;HEAP32[$v2_tail>>2]=0;label=14;break;case 14:return}}function _freegfc($gfc){var label=0;label=1;while(1)switch(label){case 1:var $i_035=0;label=2;break;case 2:var $i_035;var $arrayidx=$gfc+37192+($i_035<<2)|0;var $0=HEAP32[$arrayidx>>2];var $cmp1=($0|0)==0;if($cmp1){label=4;break}else{label=3;break};case 3:var $1=$0;_free($1);HEAP32[$arrayidx>>2]=0;label=4;break;case 4:var $inc=$i_035+1|0;var $cmp=($inc|0)<641;if($cmp){var $i_035=$inc;label=2;break}else{label=5;break};case 5:var $arrayidx9=$gfc+37184|0;var $2=HEAP32[$arrayidx9>>2];var $tobool=($2|0)==0;if($tobool){label=7;break}else{label=6;break};case 6:var $3=$2;_free($3);HEAP32[$arrayidx9>>2]=0;label=7;break;case 7:var $arrayidx20=$gfc+37188|0;var $4=HEAP32[$arrayidx20>>2];var $tobool21=($4|0)==0;if($tobool21){label=9;break}else{label=8;break};case 8:var $5=$4;_free($5);HEAP32[$arrayidx20>>2]=0;label=9;break;case 9:var $buf=$gfc+284|0;var $6=HEAP32[$buf>>2];var $cmp30=($6|0)==0;if($cmp30){label=11;break}else{label=10;break};case 10:_free($6);HEAP32[$buf>>2]=0;label=11;break;case 11:var $bag=$gfc+85780|0;var $7=HEAP32[$bag>>2];var $tobool37=($7|0)==0;if($tobool37){label=13;break}else{label=12;break};case 12:var $8=$7;_free($8);HEAP32[$bag>>2]=0;var $size=$gfc+85776|0;HEAP32[$size>>2]=0;label=13;break;case 13:var $ATH=$gfc+85796|0;var $9=HEAP32[$ATH>>2];var $tobool45=($9|0)==0;if($tobool45){label=15;break}else{label=14;break};case 14:var $10=$9;_free($10);label=15;break;case 15:var $rgdata=$gfc+85676|0;var $11=HEAP32[$rgdata>>2];var $tobool49=($11|0)==0;if($tobool49){label=17;break}else{label=16;break};case 16:var $12=$11;_free($12);label=17;break;case 17:var $in_buffer_0=$gfc+52152|0;var $13=HEAP32[$in_buffer_0>>2];var $tobool55=($13|0)==0;if($tobool55){label=19;break}else{label=18;break};case 18:var $14=$13;_free($14);label=19;break;case 19:var $in_buffer_1=$gfc+52156|0;var $15=HEAP32[$in_buffer_1>>2];var $tobool61=($15|0)==0;if($tobool61){label=21;break}else{label=20;break};case 20:var $16=$15;_free($16);label=21;break;case 21:_free_id3tag($gfc);var $hip=$gfc+85808|0;var $17=HEAP32[$hip>>2];var $tobool66=($17|0)==0;if($tobool66){label=23;break}else{label=22;break};case 22:var $call=_hip_decode_exit($17);HEAP32[$hip>>2]=0;label=24;break;case 23:var $tobool_i=($gfc|0)==0;if($tobool_i){label=30;break}else{label=24;break};case 24:var $cd_psy_i=$gfc+85800|0;var $18=HEAP32[$cd_psy_i>>2];var $tobool1_i=($18|0)==0;if($tobool1_i){label=30;break}else{label=25;break};case 25:var $s3_i=$18+2156|0;var $19=HEAP32[$s3_i>>2];var $tobool3_i=($19|0)==0;if($tobool3_i){var $21=$18;label=27;break}else{label=26;break};case 26:var $20=$19;_free($20);var $_pre_i=HEAP32[$cd_psy_i>>2];var $21=$_pre_i;label=27;break;case 27:var $21;var $s39_i=$21+4316|0;var $22=HEAP32[$s39_i>>2];var $tobool10_i=($22|0)==0;if($tobool10_i){var $24=$21;label=29;break}else{label=28;break};case 28:var $23=$22;_free($23);var $_pre8_i=HEAP32[$cd_psy_i>>2];var $24=$_pre8_i;label=29;break;case 29:var $24;var $25=$24;_free($25);label=30;break;case 30:var $26=$gfc;_free($26);return}}function _malloc_aligned($ptr,$size,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $tobool=($ptr|0)==0;if($tobool){label=6;break}else{label=2;break};case 2:var $pointer=$ptr+4|0;var $0=HEAP32[$pointer>>2];var $tobool1=($0|0)==0;if($tobool1){label=3;break}else{label=6;break};case 3:var $add=$bytes+$size|0;var $call=_malloc($add);HEAP32[$pointer>>2]=$call;var $cmp=($bytes|0)==0;if($cmp){label=5;break}else{label=4;break};case 4:var $1=$call;var $add6=$bytes-1|0;var $sub=$add6+$1|0;var $div=($sub>>>0)%($bytes>>>0)&-1;var $mul=$sub-$div|0;var $2=$mul;var $aligned=$ptr|0;HEAP32[$aligned>>2]=$2;label=6;break;case 5:var $aligned8=$ptr|0;HEAP32[$aligned8>>2]=$call;label=6;break;case 6:return}}function _free_aligned($ptr){var label=0;label=1;while(1)switch(label){case 1:var $tobool=($ptr|0)==0;if($tobool){label=4;break}else{label=2;break};case 2:var $pointer=$ptr+4|0;var $0=HEAP32[$pointer>>2];var $tobool1=($0|0)==0;if($tobool1){label=4;break}else{label=3;break};case 3:_free($0);HEAP32[$pointer>>2]=0;var $aligned=$ptr|0;HEAP32[$aligned>>2]=0;label=4;break;case 4:return}}function _ATHformula($cfg,$f){var label=0;label=1;while(1)switch(label){case 1:var $ATHtype=$cfg+192|0;var $0=HEAP32[$ATHtype>>2];switch($0|0){case 0:{label=2;break};case 1:{label=3;break};case 2:{label=4;break};case 3:{label=5;break};case 4:{label=6;break};case 5:{label=7;break};default:{label=8;break}}break;case 2:var $conv_i=$f;var $cmp_i=$conv_i<-.3;var $f_addr_0_i=$cmp_i?3410:$f;var $div_i=$f_addr_0_i/1e3;var $cmp2_i=$div_i<.10000000149011612;var $cond_i=$cmp2_i?.10000000149011612:$div_i;var $cmp4_i=$cond_i>24;var $1=$cond_i;var $conv10_i=$cmp4_i?24:$1;var $2=Math.pow($conv10_i,-.8);var $mul_i=$2*3.64;var $sub_i=$conv10_i+ -3.4;var $pow2_i=$sub_i*$sub_i;var $mul12_i=$pow2_i*-.6;var $call_i=Math.exp($mul12_i);var $mul13_i=$call_i*6.8;var $sub14_i=$mul_i-$mul13_i;var $sub16_i=$conv10_i+ -8.7;var $pow212_i=$sub16_i*$sub16_i;var $mul17_i=$pow212_i*-.15;var $call18_i=Math.exp($mul17_i);var $mul19_i=$call18_i*6;var $add_i=$sub14_i+$mul19_i;var $3=Math.pow($conv10_i,4);var $mul25_i=$3*96e-5;var $add26_i=$add_i+$mul25_i;var $conv27_i=$add26_i;var $ath_0=$conv27_i;label=9;break;case 3:var $conv_i9=$f;var $cmp_i10=$conv_i9<-.3;var $f_addr_0_i11=$cmp_i10?3410:$f;var $div_i12=$f_addr_0_i11/1e3;var $cmp2_i13=$div_i12<.10000000149011612;var $cond_i14=$cmp2_i13?.10000000149011612:$div_i12;var $cmp4_i15=$cond_i14>24;var $4=$cond_i14;var $conv10_i17=$cmp4_i15?24:$4;var $5=Math.pow($conv10_i17,-.8);var $mul_i18=$5*3.64;var $sub_i19=$conv10_i17+ -3.4;var $pow2_i20=$sub_i19*$sub_i19;var $mul12_i21=$pow2_i20*-.6;var $call_i22=Math.exp($mul12_i21);var $mul13_i23=$call_i22*6.8;var $sub14_i24=$mul_i18-$mul13_i23;var $sub16_i25=$conv10_i17+ -8.7;var $pow212_i26=$sub16_i25*$sub16_i25;var $mul17_i27=$pow212_i26*-.15;var $call18_i28=Math.exp($mul17_i27);var $mul19_i29=$call18_i28*6;var $add_i30=$sub14_i24+$mul19_i29;var $6=Math.pow($conv10_i17,4);var $mul25_i31=$6*56e-5;var $add26_i32=$add_i30+$mul25_i31;var $conv27_i33=$add26_i32;var $ath_0=$conv27_i33;label=9;break;case 4:var $conv_i34=$f;var $cmp_i35=$conv_i34<-.3;var $f_addr_0_i36=$cmp_i35?3410:$f;var $div_i37=$f_addr_0_i36/1e3;var $cmp2_i38=$div_i37<.10000000149011612;var $cond_i39=$cmp2_i38?.10000000149011612:$div_i37;var $cmp4_i40=$cond_i39>24;var $7=$cond_i39;var $conv10_i42=$cmp4_i40?24:$7;var $8=Math.pow($conv10_i42,-.8);var $mul_i43=$8*3.64;var $sub_i44=$conv10_i42+ -3.4;var $pow2_i45=$sub_i44*$sub_i44;var $mul12_i46=$pow2_i45*-.6;var $call_i47=Math.exp($mul12_i46);var $mul13_i48=$call_i47*6.8;var $sub14_i49=$mul_i43-$mul13_i48;var $sub16_i50=$conv10_i42+ -8.7;var $pow212_i51=$sub16_i50*$sub16_i50;var $mul17_i52=$pow212_i51*-.15;var $call18_i53=Math.exp($mul17_i52);var $mul19_i54=$call18_i53*6;var $add_i55=$sub14_i49+$mul19_i54;var $9=Math.pow($conv10_i42,4);var $mul25_i56=$9*6e-4;var $add26_i57=$add_i55+$mul25_i56;var $conv27_i58=$add26_i57;var $ath_0=$conv27_i58;label=9;break;case 5:var $conv_i59=$f;var $cmp_i60=$conv_i59<-.3;var $f_addr_0_i61=$cmp_i60?3410:$f;var $div_i62=$f_addr_0_i61/1e3;var $cmp2_i63=$div_i62<.10000000149011612;var $cond_i64=$cmp2_i63?.10000000149011612:$div_i62;var $cmp4_i65=$cond_i64>24;var $10=$cond_i64;var $conv10_i67=$cmp4_i65?24:$10;var $11=Math.pow($conv10_i67,-.8);var $mul_i68=$11*3.64;var $sub_i69=$conv10_i67+ -3.4;var $pow2_i70=$sub_i69*$sub_i69;var $mul12_i71=$pow2_i70*-.6;var $call_i72=Math.exp($mul12_i71);var $mul13_i73=$call_i72*6.8;var $sub14_i74=$mul_i68-$mul13_i73;var $sub16_i75=$conv10_i67+ -8.7;var $pow212_i76=$sub16_i75*$sub16_i75;var $mul17_i77=$pow212_i76*-.15;var $call18_i78=Math.exp($mul17_i77);var $mul19_i79=$call18_i78*6;var $add_i80=$sub14_i74+$mul19_i79;var $12=Math.pow($conv10_i67,4);var $mul25_i81=$12*64e-5;var $add26_i82=$add_i80+$mul25_i81;var $conv27_i83=$add26_i82;var $add=$conv27_i83+6;var $ath_0=$add;label=9;break;case 6:var $ATHcurve=$cfg+188|0;var $13=HEAPF32[$ATHcurve>>2];var $conv_i84=$f;var $cmp_i85=$conv_i84<-.3;var $f_addr_0_i86=$cmp_i85?3410:$f;var $div_i87=$f_addr_0_i86/1e3;var $cmp2_i88=$div_i87<.10000000149011612;var $cond_i89=$cmp2_i88?.10000000149011612:$div_i87;var $cmp4_i90=$cond_i89>24;var $14=$cond_i89;var $conv10_i92=$cmp4_i90?24:$14;var $15=Math.pow($conv10_i92,-.8);var $mul_i93=$15*3.64;var $sub_i94=$conv10_i92+ -3.4;var $pow2_i95=$sub_i94*$sub_i94;var $mul12_i96=$pow2_i95*-.6;var $call_i97=Math.exp($mul12_i96);var $mul13_i98=$call_i97*6.8;var $sub14_i99=$mul_i93-$mul13_i98;var $sub16_i100=$conv10_i92+ -8.7;var $pow212_i101=$sub16_i100*$sub16_i100;var $mul17_i102=$pow212_i101*-.15;var $call18_i103=Math.exp($mul17_i102);var $mul19_i104=$call18_i103*6;var $add_i105=$sub14_i99+$mul19_i104;var $conv20_i=$13;var $mul21_i=$conv20_i*.04;var $add22_i=$mul21_i+.6;var $mul23_i=$add22_i*.001;var $16=Math.pow($conv10_i92,4);var $mul25_i106=$mul23_i*$16;var $add26_i107=$add_i105+$mul25_i106;var $conv27_i108=$add26_i107;var $ath_0=$conv27_i108;label=9;break;case 7:var $ATHcurve10=$cfg+188|0;var $17=HEAPF32[$ATHcurve10>>2];var $conv_i109=$f;var $cmp_i110=$conv_i109<-.3;var $f_addr_0_i111=$cmp_i110?3410:$f;var $div_i112=$f_addr_0_i111/1e3;var $cmp2_i113=$div_i112<3.4100000858306885;var $cond_i114=$cmp2_i113?3.4100000858306885:$div_i112;var $cmp4_i115=$cond_i114>16.100000381469727;var $18=$cond_i114;var $conv10_i117=$cmp4_i115?16.100000381469727:$18;var $19=Math.pow($conv10_i117,-.8);var $mul_i118=$19*3.64;var $sub_i119=$conv10_i117+ -3.4;var $pow2_i120=$sub_i119*$sub_i119;var $mul12_i121=$pow2_i120*-.6;var $call_i122=Math.exp($mul12_i121);var $mul13_i123=$call_i122*6.8;var $sub14_i124=$mul_i118-$mul13_i123;var $sub16_i125=$conv10_i117+ -8.7;var $pow212_i126=$sub16_i125*$sub16_i125;var $mul17_i127=$pow212_i126*-.15;var $call18_i128=Math.exp($mul17_i127);var $mul19_i129=$call18_i128*6;var $add_i130=$sub14_i124+$mul19_i129;var $conv20_i131=$17;var $mul21_i132=$conv20_i131*.04;var $add22_i133=$mul21_i132+.6;var $mul23_i134=$add22_i133*.001;var $20=Math.pow($conv10_i117,4);var $mul25_i135=$mul23_i134*$20;var $add26_i136=$add_i130+$mul25_i135;var $conv27_i137=$add26_i136;var $ath_0=$conv27_i137;label=9;break;case 8:var $conv_i138=$f;var $cmp_i139=$conv_i138<-.3;var $f_addr_0_i140=$cmp_i139?3410:$f;var $div_i141=$f_addr_0_i140/1e3;var $cmp2_i142=$div_i141<.10000000149011612;var $cond_i143=$cmp2_i142?.10000000149011612:$div_i141;var $cmp4_i144=$cond_i143>24;var $21=$cond_i143;var $conv10_i146=$cmp4_i144?24:$21;var $22=Math.pow($conv10_i146,-.8);var $mul_i147=$22*3.64;var $sub_i148=$conv10_i146+ -3.4;var $pow2_i149=$sub_i148*$sub_i148;var $mul12_i150=$pow2_i149*-.6;var $call_i151=Math.exp($mul12_i150);var $mul13_i152=$call_i151*6.8;var $sub14_i153=$mul_i147-$mul13_i152;var $sub16_i154=$conv10_i146+ -8.7;var $pow212_i155=$sub16_i154*$sub16_i154;var $mul17_i156=$pow212_i155*-.15;var $call18_i157=Math.exp($mul17_i156);var $mul19_i158=$call18_i157*6;var $add_i159=$sub14_i153+$mul19_i158;var $23=Math.pow($conv10_i146,4);var $mul25_i160=$23*6e-4;var $add26_i161=$add_i159+$mul25_i160;var $conv27_i162=$add26_i161;var $ath_0=$conv27_i162;label=9;break;case 9:var $ath_0;return $ath_0}}function _freq2bark($freq){var $conv1=$freq<0?0:$freq*.001;var $mul4=Math.atan($conv1*.76)*13;return $mul4+Math.atan($conv1*$conv1/56.25)*3.5}function _FindNearestBitrate($bRate,$version,$samplerate){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($samplerate|0)<16e3;var $_version=$cmp?2:$version;var $arrayidx1=16492+($_version<<6)|0;var $0=HEAP32[$arrayidx1>>2];var $bitrate_015=$0;var $i_016=2;label=2;break;case 2:var $i_016;var $bitrate_015;var $arrayidx4=16488+($_version<<6)+($i_016<<2)|0;var $1=HEAP32[$arrayidx4>>2];var $cmp5=($1|0)>0;if($cmp5){label=3;break}else{var $bitrate_1=$bitrate_015;label=4;break};case 3:var $sub=$1-$bRate|0;var $cmp9=($sub|0)>0;var $sub16=-$sub|0;var $cond=$cmp9?$sub:$sub16;var $sub17=$bitrate_015-$bRate|0;var $cmp18=($sub17|0)>0;var $sub23=-$sub17|0;var $cond25=$cmp18?$sub17:$sub23;var $cmp26=($cond|0)<($cond25|0);var $_bitrate_0=$cmp26?$1:$bitrate_015;var $bitrate_1=$_bitrate_0;label=4;break;case 4:var $bitrate_1;var $inc=$i_016+1|0;var $cmp2=($inc|0)<15;if($cmp2){var $bitrate_015=$bitrate_1;var $i_016=$inc;label=2;break}else{label=5;break};case 5:return $bitrate_1}}function _nearestBitrateFullIndex($bitrate){var label=0;label=1;while(1)switch(label){case 1:var $conv=$bitrate&65535;var $b_0=0;label=2;break;case 2:var $b_0;var $cmp=($b_0|0)<16;if($cmp){label=3;break}else{var $upper_range_kbps_0=320;var $upper_range_0=16;var $lower_range_kbps_0=320;var $lower_range_0=16;label=5;break};case 3:var $add=$b_0+1|0;var $arrayidx=10576+($add<<2)|0;var $0=HEAP32[$arrayidx>>2];var $cmp1=($conv|0)>($0|0);var $conv_=$cmp1?$conv:$0;var $cmp7=($conv_|0)==($conv|0);if($cmp7){var $b_0=$add;label=2;break}else{label=4;break};case 4:var $arrayidx12=10576+($b_0<<2)|0;var $1=HEAP32[$arrayidx12>>2];var $upper_range_kbps_0=$0;var $upper_range_0=$add;var $lower_range_kbps_0=$1;var $lower_range_0=$b_0;label=5;break;case 5:var $lower_range_0;var $lower_range_kbps_0;var $upper_range_0;var $upper_range_kbps_0;var $sub=$upper_range_kbps_0-$conv|0;var $sub15=$conv-$lower_range_kbps_0|0;var $cmp16=($sub|0)>($sub15|0);var $lower_range_0_upper_range_0=$cmp16?$lower_range_0:$upper_range_0;return $lower_range_0_upper_range_0}}function _map2MP3Frequency($freq){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($freq|0)<8001;if($cmp){var $retval_0=8e3;label=9;break}else{label=2;break};case 2:var $cmp1=($freq|0)<11026;if($cmp1){var $retval_0=11025;label=9;break}else{label=3;break};case 3:var $cmp4=($freq|0)<12001;if($cmp4){var $retval_0=12e3;label=9;break}else{label=4;break};case 4:var $cmp7=($freq|0)<16001;if($cmp7){var $retval_0=16e3;label=9;break}else{label=5;break};case 5:var $cmp10=($freq|0)<22051;if($cmp10){var $retval_0=22050;label=9;break}else{label=6;break};case 6:var $cmp13=($freq|0)<24001;if($cmp13){var $retval_0=24e3;label=9;break}else{label=7;break};case 7:var $cmp16=($freq|0)<32001;if($cmp16){var $retval_0=32e3;label=9;break}else{label=8;break};case 8:var $cmp19=($freq|0)<44101;var $_=$cmp19?44100:48e3;var $retval_0=$_;label=9;break;case 9:var $retval_0;return $retval_0}}function _BitrateIndex($bRate,$version,$samplerate){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($samplerate|0)<16e3;var $_version=$cmp?2:$version;var $i_0=0;label=2;break;case 2:var $i_0;var $cmp1=($i_0|0)<15;if($cmp1){label=3;break}else{var $retval_0=-1;label=4;break};case 3:var $arrayidx2=16488+($_version<<6)+($i_0<<2)|0;var $0=HEAP32[$arrayidx2>>2];var $cmp3=($0|0)>0;var $cmp7=($0|0)==($bRate|0);var $or_cond=$cmp3&$cmp7;var $inc=$i_0+1|0;if($or_cond){var $retval_0=$i_0;label=4;break}else{var $i_0=$inc;label=2;break};case 4:var $retval_0;return $retval_0}}function _SmpFrqIndex($sample_freq,$version){var label=0;label=1;while(1)switch(label){case 1:if(($sample_freq|0)==8e3){label=10;break}else if(($sample_freq|0)==44100){label=2;break}else if(($sample_freq|0)==48e3){label=3;break}else if(($sample_freq|0)==32e3){label=4;break}else if(($sample_freq|0)==22050){label=5;break}else if(($sample_freq|0)==24e3){label=6;break}else if(($sample_freq|0)==16e3){label=7;break}else if(($sample_freq|0)==11025){label=8;break}else if(($sample_freq|0)==12e3){label=9;break}else{label=11;break};case 2:HEAP32[$version>>2]=1;var $retval_0=0;label=12;break;case 3:HEAP32[$version>>2]=1;var $retval_0=1;label=12;break;case 4:HEAP32[$version>>2]=1;var $retval_0=2;label=12;break;case 5:HEAP32[$version>>2]=0;var $retval_0=0;label=12;break;case 6:HEAP32[$version>>2]=0;var $retval_0=1;label=12;break;case 7:HEAP32[$version>>2]=0;var $retval_0=2;label=12;break;case 8:HEAP32[$version>>2]=0;var $retval_0=0;label=12;break;case 9:HEAP32[$version>>2]=0;var $retval_0=1;label=12;break;case 10:HEAP32[$version>>2]=0;var $retval_0=2;label=12;break;case 11:HEAP32[$version>>2]=0;var $retval_0=-1;label=12;break;case 12:var $retval_0;return $retval_0}}function _isResamplingNecessary($cfg){var label=0;label=1;while(1)switch(label){case 1:var $samplerate_out=$cfg+48|0;var $0=HEAP32[$samplerate_out>>2];var $conv=$0|0;var $mul=$conv*.9994999766349792;var $conv1=$mul&-1;var $samplerate_in=$cfg+44|0;var $1=HEAP32[$samplerate_in>>2];var $cmp=($1|0)<($conv1|0);if($cmp){var $2=1;label=3;break}else{label=2;break};case 2:var $mul4=$conv*1.000499963760376;var $conv5=$mul4&-1;var $cmp8=($conv5|0)<($1|0);var $phitmp=$cmp8&1;var $2=$phitmp;label=3;break;case 3:var $2;return $2}}function _fill_buffer($gfc,$mfbuf,$in_buffer,$nsamples,$n_in,$n_out){var label=0;label=1;while(1)switch(label){case 1:var $mf_size2=$gfc+84036|0;var $0=HEAP32[$mf_size2>>2];var $mode_gr=$gfc+76|0;var $1=HEAP32[$mode_gr>>2];var $mul=$1*576&-1;var $channels_out=$gfc+72|0;var $2=HEAP32[$channels_out>>2];var $samplerate_out_i=$gfc+64|0;var $3=HEAP32[$samplerate_out_i>>2];var $conv_i=$3|0;var $mul_i=$conv_i*.9994999766349792;var $conv1_i=$mul_i&-1;var $samplerate_in_i=$gfc+60|0;var $4=HEAP32[$samplerate_in_i>>2];var $cmp_i=($4|0)<($conv1_i|0);if($cmp_i){label=3;break}else{label=2;break};case 2:var $mul4_i=$conv_i*1.000499963760376;var $conv5_i=$mul4_i&-1;var $cmp8_i=($conv5_i|0)<($4|0);if($cmp8_i){label=3;break}else{label=40;break};case 3:var $fill_buffer_resample_init_i=$gfc+12|0;var $arrayidx_i=$gfc+37184|0;var $arrayidx31_i=$gfc+37188|0;var $arrayidx36141_i=$gfc+37168|0;var $5=$arrayidx36141_i;var $cmp83122_i=($mul|0)>0;var $ch_0=0;var $7=$4;var $6=$3;label=4;break;case 4:var $6;var $7;var $ch_0;var $arrayidx=$mfbuf+($ch_0<<2)|0;var $8=HEAP32[$arrayidx>>2];var $arrayidx4=$in_buffer+($ch_0<<2)|0;var $9=HEAP32[$arrayidx4>>2];var $conv_i25=$7|0;var $conv2_i=$6|0;var $div_i=$conv_i25/$conv2_i;var $tobool4_i_i=($7|0)==0;if($tobool4_i_i){var $i_tr_lcssa_i_i=$6;label=6;break}else{var $i_tr5_i_i=$6;var $j_tr6_i_i=$7;label=5;break};case 5:var $j_tr6_i_i;var $i_tr5_i_i;var $rem_i_i=($i_tr5_i_i|0)%($j_tr6_i_i|0)&-1;var $tobool_i_i=($rem_i_i|0)==0;if($tobool_i_i){var $i_tr_lcssa_i_i=$j_tr6_i_i;label=6;break}else{var $i_tr5_i_i=$j_tr6_i_i;var $j_tr6_i_i=$rem_i_i;label=5;break};case 6:var $i_tr_lcssa_i_i;var $div6_i=($6|0)/($i_tr_lcssa_i_i|0)&-1;var $cmp_i27=($div6_i|0)>320;var $_div6_i=$cmp_i27?320:$div6_i;var $add_i=$div_i+.5;var $call8_i=Math.floor($add_i);var $sub_i=$div_i-$call8_i;var $call9_i=Math.abs($sub_i);var $cmp10_i=$call9_i<1e-4;var $div13_i=1/$div_i;var $conv14_i=$div13_i;var $cmp16_i=$conv14_i>1;var $conv22_i=$cmp10_i?32:31;var $add23_i=$conv22_i+1|0;var $10=HEAP32[$fill_buffer_resample_init_i>>2];var $cmp24_i=($10|0)==0;if($cmp24_i){label=7;break}else{var $j_1_i=0;label=19;break};case 7:var $call27_i=_calloc($add23_i,4);var $11=$call27_i;HEAP32[$arrayidx_i>>2]=$11;var $call29_i=_calloc($add23_i,4);var $12=$call29_i;HEAP32[$arrayidx31_i>>2]=$12;var $mul_i28=$_div6_i<<1;var $cmp32132_i=($mul_i28|0)<0;if($cmp32132_i){label=8;break}else{var $i_0133_i=0;label=9;break};case 8:HEAP32[$5>>2]=0;HEAP32[$5+4>>2]=0;HEAP32[$5+8>>2]=0;HEAP32[$5+12>>2]=0;var $j_0_lcssa_i=0;label=18;break;case 9:var $i_0133_i;var $call34_i=_calloc($add23_i,4);var $13=$call34_i;var $arrayidx35_i=$gfc+37192+($i_0133_i<<2)|0;HEAP32[$arrayidx35_i>>2]=$13;var $inc_i=$i_0133_i+1|0;var $cmp32_i=($inc_i|0)>($mul_i28|0);if($cmp32_i){label=10;break}else{var $i_0133_i=$inc_i;label=9;break};case 10:HEAP32[$5>>2]=0;HEAP32[$5+4>>2]=0;HEAP32[$5+8>>2]=0;HEAP32[$5+12>>2]=0;var $conv46_i=$_div6_i|0;var $mul47_i=$conv46_i*2;var $14=$conv14_i;var $_op_i=$14*3.141592653589793;var $15=$_op_i;var $conv1_i_i=$cmp16_i?3.1415927410125732:$15;var $conv2_i_i=$conv22_i|0;var $conv26_i_i=$conv1_i_i;var $div27_i_i=$conv26_i_i/3.141592653589793;var $mul31_i_i=$conv2_i_i*$conv1_i_i;var $conv36_i_i=$conv22_i|0;var $mul37_i_i=$conv36_i_i*3.141592653589793;var $16=($div6_i|0)<320;var $j_0130_i=0;label=11;break;case 11:var $j_0130_i;var $sub44_i=$j_0130_i-$_div6_i|0;var $conv45_i=$sub44_i|0;var $div48_i=$conv45_i/$mul47_i;var $conv49_i=$div48_i;var $arrayidx58_i=$gfc+37192+($j_0130_i<<2)|0;var $sum_0126_i=0;var $i_1127_i=0;label=12;break;case 12:var $i_1127_i;var $sum_0126_i;var $conv54_i=$i_1127_i|0;var $sub55_i=$conv54_i-$conv49_i;var $div_i_i=$sub55_i/$conv2_i_i;var $cmp_i_i=$div_i_i<0;var $x_addr_0_i_i=$cmp_i_i?0:$div_i_i;var $cmp4_i_i=$x_addr_0_i_i>1;var $x_addr_1_i_i=$cmp4_i_i?1:$x_addr_0_i_i;var $conv9_i_i=$x_addr_1_i_i+ -.5;var $fabsf_i_i=Math.abs($conv9_i_i);var $call22_i_i=$fabsf_i_i;var $cmp23_i_i=$call22_i_i<1e-9;if($cmp23_i_i){var $retval_0_in_i_i=$div27_i_i;label=14;break}else{label=13;break};case 13:var $conv21_i_i=$conv9_i_i;var $mul10_i_i=$x_addr_1_i_i*2;var $mul15_i_i=$x_addr_1_i_i*4;var $conv11_i_i=$mul10_i_i;var $conv16_i_i=$mul15_i_i;var $mul12_i_i=$conv11_i_i*3.141592653589793;var $mul17_i_i=$conv16_i_i*3.141592653589793;var $call_i_i=Math.cos($mul12_i_i);var $call18_i_i=Math.cos($mul17_i_i);var $mul13_i_i=$call_i_i*.5;var $mul19_i_i=$call18_i_i*.08;var $sub14_i_i=.42-$mul13_i_i;var $add_i_i=$sub14_i_i+$mul19_i_i;var $conv20_i_i=$add_i_i;var $conv29_i_i=$conv20_i_i;var $mul32_i_i=$mul31_i_i*$conv9_i_i;var $conv33_i_i=$mul32_i_i;var $call34_i_i=Math.sin($conv33_i_i);var $mul35_i_i=$call34_i_i*$conv29_i_i;var $mul39_i_i=$mul37_i_i*$conv21_i_i;var $div40_i_i=$mul35_i_i/$mul39_i_i;var $retval_0_in_i_i=$div40_i_i;label=14;break;case 14:var $retval_0_in_i_i;var $retval_0_i_i=$retval_0_in_i_i;var $17=HEAP32[$arrayidx58_i>>2];var $arrayidx59_i=$17+($i_1127_i<<2)|0;HEAPF32[$arrayidx59_i>>2]=$retval_0_i_i;var $add60_i=$sum_0126_i+$retval_0_i_i;var $inc62_i=$i_1127_i+1|0;var $cmp51_i=($inc62_i|0)>($conv22_i|0);if($cmp51_i){var $i_2128_i=0;label=15;break}else{var $sum_0126_i=$add60_i;var $i_1127_i=$inc62_i;label=12;break};case 15:var $i_2128_i;var $18=HEAP32[$arrayidx58_i>>2];var $arrayidx70_i=$18+($i_2128_i<<2)|0;var $19=HEAPF32[$arrayidx70_i>>2];var $div71_i=$19/$add60_i;HEAPF32[$arrayidx70_i>>2]=$div71_i;var $inc73_i=$i_2128_i+1|0;var $cmp65_i=($inc73_i|0)>($conv22_i|0);if($cmp65_i){label=16;break}else{var $i_2128_i=$inc73_i;label=15;break};case 16:var $inc76_i=$j_0130_i+1|0;var $cmp41_i=($inc76_i|0)>($mul_i28|0);if($cmp41_i){label=17;break}else{var $j_0130_i=$inc76_i;label=11;break};case 17:var $20=$div6_i<<1;var $_op139_op140_i=$20|1;var $21=$16?$_op139_op140_i:641;var $j_0_lcssa_i=$21;label=18;break;case 18:var $j_0_lcssa_i;HEAP32[$fill_buffer_resample_init_i>>2]=1;var $j_1_i=$j_0_lcssa_i;label=19;break;case 19:var $j_1_i;var $arrayidx81_i=$gfc+37184+($ch_0<<2)|0;var $22=HEAP32[$arrayidx81_i>>2];if($cmp83122_i){label=21;break}else{label=20;break};case 20:var $div143_pre_i=$conv22_i>>>1;var $add142_pre_i=$conv22_i-$div143_pre_i|0;var $arrayidx159_pre_i=$gfc+37168+($ch_0<<3)|0;var $j_3_i=$j_1_i;var $k_0_lcssa_i=0;var $add142_pre_phi_i=$add142_pre_i;var $arrayidx159_pre_phi_i=$arrayidx159_pre_i;label=29;break;case 21:var $arrayidx89_i=$gfc+37168+($ch_0<<3)|0;var $div94_i=$conv22_i>>>1;var $add93_i=$conv22_i-$div94_i|0;var $rem_i=$conv22_i&1;var $conv104_i=$rem_i|0;var $mul105_i=$conv104_i*.5;var $conv110_i=$_div6_i|0;var $k_0123_i=0;label=22;break;case 22:var $k_0123_i;var $conv86_i=$k_0123_i|0;var $mul87_i=$div_i*$conv86_i;var $23=HEAPF64[$arrayidx89_i>>3];var $sub90_i=$mul87_i-$23;var $call91_i=Math.floor($sub90_i);var $conv92_i=$call91_i&-1;var $sub95_i=$conv92_i+$add93_i|0;var $cmp96_i=($sub95_i|0)<($nsamples|0);if($cmp96_i){label=23;break}else{var $j_3_i=$conv92_i;var $k_0_lcssa_i=$k_0123_i;var $add142_pre_phi_i=$add93_i;var $arrayidx159_pre_phi_i=$arrayidx89_i;label=29;break};case 23:var $conv103_i=$conv92_i|0;var $add106_i=$mul105_i+$conv103_i;var $sub107_i=$sub90_i-$add106_i;var $conv108_i=$sub107_i;var $mul109_i=$conv108_i*2;var $mul111_i=$conv110_i*$mul109_i;var $add113_i=$conv110_i+$mul111_i;var $conv114_i=$add113_i;var $add115_i=$conv114_i+.5;var $call116_i=Math.floor($add115_i);var $conv117_i=$call116_i&-1;var $add122_i=$conv92_i-$div94_i|0;var $arrayidx131_i=$gfc+37192+($conv117_i<<2)|0;var $24=HEAP32[$arrayidx131_i>>2];var $i_3120_i=0;var $xvalue_0121_i=0;label=24;break;case 24:var $xvalue_0121_i;var $i_3120_i;var $sub124_i=$i_3120_i+$add122_i|0;var $cmp125_i=($sub124_i|0)<0;if($cmp125_i){label=25;break}else{label=26;break};case 25:var $add127_i=$sub124_i+$add23_i|0;var $arrayidx128_i=$22+($add127_i<<2)|0;var $cond_in_i=$arrayidx128_i;label=27;break;case 26:var $arrayidx129_i=$9+($sub124_i<<2)|0;var $cond_in_i=$arrayidx129_i;label=27;break;case 27:var $cond_in_i;var $cond_i=HEAPF32[$cond_in_i>>2];var $arrayidx132_i=$24+($i_3120_i<<2)|0;var $25=HEAPF32[$arrayidx132_i>>2];var $mul133_i=$cond_i*$25;var $add134_i=$xvalue_0121_i+$mul133_i;var $inc136_i=$i_3120_i+1|0;var $cmp119_i=($inc136_i|0)>($conv22_i|0);if($cmp119_i){label=28;break}else{var $i_3120_i=$inc136_i;var $xvalue_0121_i=$add134_i;label=24;break};case 28:var $arrayidx3_sum=$k_0123_i+$0|0;var $arrayidx138_i=$8+($arrayidx3_sum<<2)|0;HEAPF32[$arrayidx138_i>>2]=$add134_i;var $inc140_i=$k_0123_i+1|0;var $cmp83_i=($inc140_i|0)<($mul|0);if($cmp83_i){var $k_0123_i=$inc140_i;label=22;break}else{var $j_3_i=$conv92_i;var $k_0_lcssa_i=$inc140_i;var $add142_pre_phi_i=$add93_i;var $arrayidx159_pre_phi_i=$arrayidx89_i;label=29;break};case 29:var $arrayidx159_pre_phi_i;var $add142_pre_phi_i;var $k_0_lcssa_i;var $j_3_i;var $sub144_i=$j_3_i+$add142_pre_phi_i|0;var $cmp145_i=($sub144_i|0)>($nsamples|0);var $len_sub144_i=$cmp145_i?$nsamples:$sub144_i;HEAP32[$n_in>>2]=$len_sub144_i;var $conv154_i=$len_sub144_i|0;var $conv155_i=$k_0_lcssa_i|0;var $mul156_i=$div_i*$conv155_i;var $sub157_i=$conv154_i-$mul156_i;var $26=HEAPF64[$arrayidx159_pre_phi_i>>3];var $add160_i=$26+$sub157_i;HEAPF64[$arrayidx159_pre_phi_i>>3]=$add160_i;var $27=HEAP32[$n_in>>2];var $cmp161_i=($27|0)<($add23_i|0);if($cmp161_i){label=32;break}else{label=30;break};case 30:var $add23_neg_i=~$conv22_i;var $sub169_i31=$27+$add23_neg_i|0;var $arrayidx170_i32=$9+($sub169_i31<<2)|0;var $28=HEAPF32[$arrayidx170_i32>>2];HEAPF32[$22>>2]=$28;var $cmp165_i34=$add23_i>>>0>1;if($cmp165_i34){var $inc173_i35=1;label=31;break}else{label=37;break};case 31:var $inc173_i35;var $_pre138_i=HEAP32[$n_in>>2];var $add168_i=$_pre138_i+$add23_neg_i|0;var $sub169_i=$add168_i+$inc173_i35|0;var $arrayidx170_i=$9+($sub169_i<<2)|0;var $29=HEAPF32[$arrayidx170_i>>2];var $arrayidx171_i=$22+($inc173_i35<<2)|0;HEAPF32[$arrayidx171_i>>2]=$29;var $inc173_i=$inc173_i35+1|0;var $cmp165_i=($inc173_i|0)<($add23_i|0);if($cmp165_i){var $inc173_i35=$inc173_i;label=31;break}else{label=37;break};case 32:var $sub175_i=$add23_i-$27|0;var $cmp177116_i=($sub175_i|0)>0;if($cmp177116_i){label=33;break}else{var $i_5_lcssa_i=0;label=34;break};case 33:var $arrayidx181_i37=$22+($27<<2)|0;var $30=HEAPF32[$arrayidx181_i37>>2];HEAPF32[$22>>2]=$30;var $cmp177_i39=($sub175_i|0)>1;if($cmp177_i39){var $inc184_i40=1;label=35;break}else{var $i_5_lcssa_i=1;label=34;break};case 34:var $i_5_lcssa_i;var $cmp187113_i=($i_5_lcssa_i|0)<($add23_i|0);if($cmp187113_i){var $j_4114_i=0;var $i_6115_i=$i_5_lcssa_i;label=36;break}else{label=37;break};case 35:var $inc184_i40;var $_pre_i=HEAP32[$n_in>>2];var $add180_i=$inc184_i40+$_pre_i|0;var $arrayidx181_i=$22+($add180_i<<2)|0;var $31=HEAPF32[$arrayidx181_i>>2];var $arrayidx182_i=$22+($inc184_i40<<2)|0;HEAPF32[$arrayidx182_i>>2]=$31;var $inc184_i=$inc184_i40+1|0;var $cmp177_i=($inc184_i|0)<($sub175_i|0);if($cmp177_i){var $inc184_i40=$inc184_i;label=35;break}else{var $i_5_lcssa_i=$sub175_i;label=34;break};case 36:var $i_6115_i;var $j_4114_i;var $arrayidx190_i=$9+($j_4114_i<<2)|0;var $32=HEAPF32[$arrayidx190_i>>2];var $arrayidx191_i=$22+($i_6115_i<<2)|0;HEAPF32[$arrayidx191_i>>2]=$32;var $inc193_i=$i_6115_i+1|0;var $inc194_i=$j_4114_i+1|0;var $cmp187_i=($inc193_i|0)<($add23_i|0);if($cmp187_i){var $j_4114_i=$inc194_i;var $i_6115_i=$inc193_i;label=36;break}else{label=37;break};case 37:var $inc=$ch_0+1|0;var $cmp=($inc|0)<($2|0);if($cmp){label=38;break}else{label=39;break};case 38:var $_pre=HEAP32[$samplerate_in_i>>2];var $_pre43=HEAP32[$samplerate_out_i>>2];var $ch_0=$inc;var $7=$_pre;var $6=$_pre43;label=4;break;case 39:HEAP32[$n_out>>2]=$k_0_lcssa_i;label=43;break;case 40:var $cmp6=($mul|0)<($nsamples|0);var $cond=$cmp6?$mul:$nsamples;var $mul12=$cond<<2;var $ch_1=0;label=41;break;case 41:var $ch_1;var $arrayidx8=$mfbuf+($ch_1<<2)|0;var $33=HEAP32[$arrayidx8>>2];var $arrayidx9=$33+($0<<2)|0;var $34=$arrayidx9;var $arrayidx10=$in_buffer+($ch_1<<2)|0;var $35=HEAP32[$arrayidx10>>2];var $36=$35;_memcpy($34,$36,$mul12)|0;var $inc14=$ch_1+1|0;var $cmp15=($inc14|0)<($2|0);if($cmp15){var $ch_1=$inc14;label=41;break}else{label=42;break};case 42:HEAP32[$n_out>>2]=$cond;HEAP32[$n_in>>2]=$cond;label=43;break;case 43:return}}function _lame_report_def($format,$args){var $0=HEAP32[_stderr>>2];_vfprintf($0,$format,$args);_fflush($0);return}function _lame_report_fnc($print_f,$format,varrp){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+16|0;label=1;while(1)switch(label){case 1:var $args=sp;var $tobool=($print_f|0)==0;if($tobool){label=3;break}else{label=2;break};case 2:var $arraydecay=$args|0;var $arraydecay1=$args;HEAP32[$arraydecay1>>2]=varrp;HEAP32[$arraydecay1+4>>2]=0;FUNCTION_TABLE[$print_f]($format,$arraydecay);label=3;break;case 3:STACKTOP=sp;return}}function _lame_debugf($gfc,$format,varrp){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+16|0;label=1;while(1)switch(label){case 1:var $args=sp;var $tobool=($gfc|0)==0;if($tobool){label=4;break}else{label=2;break};case 2:var $report_dbg=$gfc+85832|0;var $0=HEAP32[$report_dbg>>2];var $tobool1=($0|0)==0;if($tobool1){label=4;break}else{label=3;break};case 3:var $arraydecay=$args|0;var $arraydecay2=$args;HEAP32[$arraydecay2>>2]=varrp;HEAP32[$arraydecay2+4>>2]=0;var $1=HEAP32[$report_dbg>>2];FUNCTION_TABLE[$1]($format,$arraydecay);label=4;break;case 4:STACKTOP=sp;return}}function _lame_msgf($gfc,$format,varrp){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+16|0;label=1;while(1)switch(label){case 1:var $args=sp;var $tobool=($gfc|0)==0;if($tobool){label=4;break}else{label=2;break};case 2:var $report_msg=$gfc+85828|0;var $0=HEAP32[$report_msg>>2];var $tobool1=($0|0)==0;if($tobool1){label=4;break}else{label=3;break};case 3:var $arraydecay=$args|0;var $arraydecay2=$args;HEAP32[$arraydecay2>>2]=varrp;HEAP32[$arraydecay2+4>>2]=0;var $1=HEAP32[$report_msg>>2];FUNCTION_TABLE[$1]($format,$arraydecay);label=4;break;case 4:STACKTOP=sp;return}}function _lame_errorf($gfc,$format,varrp){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+16|0;label=1;while(1)switch(label){case 1:var $args=sp;var $tobool=($gfc|0)==0;if($tobool){label=4;break}else{label=2;break};case 2:var $report_err=$gfc+85836|0;var $0=HEAP32[$report_err>>2];var $tobool1=($0|0)==0;if($tobool1){label=4;break}else{label=3;break};case 3:var $arraydecay=$args|0;var $arraydecay2=$args;HEAP32[$arraydecay2>>2]=varrp;HEAP32[$arraydecay2+4>>2]=0;var $1=HEAP32[$report_err>>2];FUNCTION_TABLE[$1]($format,$arraydecay);label=4;break;case 4:STACKTOP=sp;return}}function _has_MMX(){return 0}function _has_3DNow(){return 0}function _has_SSE(){return 0}function _has_SSE2(){return 0}function _disable_FPE(){return}function _init_log_table(){var label=0;label=1;while(1)switch(label){case 1:var $_b=HEAP8[12336];if($_b){label=3;break}else{var $j_04=0;label=2;break};case 2:var $j_04;var $conv=$j_04|0;var $div=$conv*.001953125;var $add=$div+1;var $conv1=$add;var $call=Math.log($conv1);var $div3=$call/.6931471805599453;var $conv4=$div3;var $arrayidx=85176+($j_04<<2)|0;HEAPF32[$arrayidx>>2]=$conv4;var $inc=$j_04+1|0;var $cmp=($inc|0)<513;if($cmp){var $j_04=$inc;label=2;break}else{label=3;break};case 3:HEAP8[12336]=1;return}}function _fast_log2($x){var $0=(HEAPF32[tempDoublePtr>>2]=$x,HEAP32[tempDoublePtr>>2]);var $mul=($0&16383|0)*6103515625e-14;var $shr59=$0>>>14&511;return(($0>>>23&255)-127|0)+((1-$mul)*HEAPF32[85176+($shr59<<2)>>2]+$mul*HEAPF32[85176+($shr59+1<<2)>>2])}function _VBR_encode_frame($gfc,$xr34orig,$l3_xmin,$max_bits){var label=0;var tempVarArgs=0;var sp=STACKTOP;STACKTOP=STACKTOP+320|0;label=1;while(1)switch(label){case 1:var $sftemp_i_i_i=sp;var $wrk_i=sp+160;var $0=$wrk_i;var $sfwork_=STACKTOP;STACKTOP=STACKTOP+624|0;var $vbrsfmin_=STACKTOP;STACKTOP=STACKTOP+624|0;var $that_=STACKTOP;STACKTOP=STACKTOP+144|0;var $max_nbits_ch=STACKTOP;STACKTOP=STACKTOP+16|0;var $max_nbits_gr=STACKTOP;STACKTOP=STACKTOP+8|0;var $tmpcast=$max_nbits_gr;var $use_nbits_ch=STACKTOP;STACKTOP=STACKTOP+16|0;var $use_nbits_gr=STACKTOP;STACKTOP=STACKTOP+8|0;var $tmpcast314=$use_nbits_gr;var $f=STACKTOP;STACKTOP=STACKTOP+8|0;var $tmpcast317=$f;var $f292=STACKTOP;STACKTOP=STACKTOP+8|0;var $tmpcast315=$f292;var $f389=STACKTOP;STACKTOP=STACKTOP+8|0;var $tmpcast316=$f389;var $mode_gr=$gfc+76|0;var $1=HEAP32[$mode_gr>>2];var $channels_out=$gfc+72|0;var $2=HEAP32[$channels_out>>2];var $3=$max_nbits_ch;HEAP32[$3>>2]=0;HEAP32[$3+4>>2]=0;HEAP32[$3+8>>2]=0;HEAP32[$3+12>>2]=0;var $$etemp$0$0=0;var $$etemp$0$1=0;var $st$1$0=$max_nbits_gr|0;HEAP32[$st$1$0>>2]=$$etemp$0$0;var $st$2$1=$max_nbits_gr+4|0;HEAP32[$st$2$1>>2]=$$etemp$0$1;var $4=$use_nbits_ch;HEAP32[$4>>2]=HEAP32[23232>>2];HEAP32[$4+4>>2]=HEAP32[23236>>2];HEAP32[$4+8>>2]=HEAP32[23240>>2];HEAP32[$4+12>>2]=HEAP32[23244>>2];var $$etemp$3$0=7681;var $$etemp$3$1=7681;var $st$4$0=$use_nbits_gr|0;HEAP32[$st$4$0>>2]=$$etemp$3$0;var $st$5$1=$use_nbits_gr+4|0;HEAP32[$st$5$1>>2]=$$etemp$3$1;var $cmp493=($1|0)>0;if($cmp493){label=2;break}else{var $retval_0=0;label=227;break};case 2:var $cmp3489=($2|0)>0;var $full_outer_loop=$gfc+48|0;var $5=$2<<2;var $gr_0494=0;var $max_nbits_fr_0496=0;label=5;break;case 3:if($cmp493){label=4;break}else{var $use_nbits_fr_0_lcssa=0;label=54;break};case 4:var $cmp48481=($2|0)>0;var $gr_1487=0;label=10;break;case 5:var $max_nbits_fr_0496;var $gr_0494;var $arrayidx=$tmpcast+($gr_0494<<2)|0;HEAP32[$arrayidx>>2]=0;if($cmp3489){label=6;break}else{var $max_nbits_fr_1_lcssa=$max_nbits_fr_0496;label=9;break};case 6:var $scevgep521=$use_nbits_ch+($gr_0494<<3)|0;var $scevgep521522=$scevgep521;_memset($scevgep521522,0,$5);var $_pre=HEAP32[$full_outer_loop>>2];var $ch_0490=0;var $max_nbits_fr_1491=$max_nbits_fr_0496;var $6=0;label=7;break;case 7:var $6;var $max_nbits_fr_1491;var $ch_0490;var $arrayidx6=$max_bits+($gr_0494<<3)+($ch_0490<<2)|0;var $7=HEAP32[$arrayidx6>>2];var $arrayidx8=$max_nbits_ch+($gr_0494<<3)+($ch_0490<<2)|0;HEAP32[$arrayidx8>>2]=$7;var $add=$6+$7|0;var $add16=$7+$max_nbits_fr_1491|0;var $cmp17=($_pre|0)<0;var $cond=$cmp17?46:8;var $find=$that_+($gr_0494*72&-1)+($ch_0490*36&-1)+4|0;HEAP32[$find>>2]=$cond;var $gfc22=$that_+($gr_0494*72&-1)+($ch_0490*36&-1)+12|0;HEAP32[$gfc22>>2]=$gfc;var $arrayidx24=$gfc+304+($gr_0494*10504&-1)+($ch_0490*5252&-1)|0;var $cod_info=$that_+($gr_0494*72&-1)+($ch_0490*36&-1)+16|0;HEAP32[$cod_info>>2]=$arrayidx24;var $arraydecay=$xr34orig+($gr_0494*4608&-1)+($ch_0490*2304&-1)|0;var $xr34orig31=$that_+($gr_0494*72&-1)+($ch_0490*36&-1)+8|0;HEAP32[$xr34orig31>>2]=$arraydecay;var $block_type=$gfc+304+($gr_0494*10504&-1)+($ch_0490*5252&-1)+4788|0;var $8=HEAP32[$block_type>>2];var $cmp35=($8|0)==2;var $alloc=$that_+($gr_0494*72&-1)+($ch_0490*36&-1)|0;var $short_block_constrain_long_block_constrain=$cmp35?42:28;HEAP32[$alloc>>2]=$short_block_constrain_long_block_constrain;var $inc=$ch_0490+1|0;var $cmp3=($inc|0)<($2|0);if($cmp3){var $ch_0490=$inc;var $max_nbits_fr_1491=$add16;var $6=$add;label=7;break}else{label=8;break};case 8:HEAP32[$arrayidx>>2]=$add;var $max_nbits_fr_1_lcssa=$add16;label=9;break;case 9:var $max_nbits_fr_1_lcssa;var $inc42=$gr_0494+1|0;var $cmp=($inc42|0)<($1|0);if($cmp){var $gr_0494=$inc42;var $max_nbits_fr_0496=$max_nbits_fr_1_lcssa;label=5;break}else{label=3;break};case 10:var $gr_1487;if($cmp48481){var $ch_1482=0;label=13;break}else{label=45;break};case 11:if($cmp493){label=12;break}else{var $use_nbits_fr_0_lcssa=0;label=54;break};case 12:var $cmp79474=($2|0)>0;var $l3_side_i=$gfc+304|0;var $use_best_huffman_i=$gfc+36|0;var $gr_2477=0;var $use_nbits_fr_0479=0;label=46;break;case 13:var $ch_1482;var $scevgep=$vbrsfmin_+($gr_1487*312&-1)+($ch_1482*156&-1)|0;var $arrayidx51=$max_bits+($gr_1487<<3)+($ch_1482<<2)|0;var $9=HEAP32[$arrayidx51>>2];var $cmp52=($9|0)>0;if($cmp52){label=14;break}else{label=44;break};case 14:var $arraydecay58=$sfwork_+($gr_1487*312&-1)+($ch_1482*156&-1)|0;var $cod_info_i=$that_+($gr_1487*72&-1)+($ch_1482*36&-1)+16|0;var $10=HEAP32[$cod_info_i>>2];var $xr34orig_i=$that_+($gr_1487*72&-1)+($ch_1482*36&-1)+8|0;var $11=HEAP32[$xr34orig_i>>2];var $max_nonzero_coeff10_i=$10+5208|0;var $12=HEAP32[$max_nonzero_coeff10_i>>2];var $psymax12_i=$10+4864|0;var $13=HEAP32[$psymax12_i>>2];var $mingain_l_i=$that_+($gr_1487*72&-1)+($ch_1482*36&-1)+20|0;var $find_i=$that_+($gr_1487*72&-1)+($ch_1482*36&-1)+4|0;var $14=$mingain_l_i;HEAP32[$14>>2]=0;HEAP32[$14+4>>2]=0;HEAP32[$14+8>>2]=0;HEAP32[$14+12>>2]=0;var $i_070_i=0;var $j_071_i=0;var $m_o_072_i=-1;var $sfb_073_i=0;var $maxsf_074_i=0;label=17;break;case 15:var $arrayidx55=$that_+($gr_1487*72&-1)+($ch_1482*36&-1)|0;var $cmp8568_i=($inc83_i|0)<39;if($cmp8568_i){label=16;break}else{label=37;break};case 16:var $conv87_i=$maxsf_3_i&255;var $scevgep517=$vbrsfmin_+($gr_1487*312&-1)+($ch_1482*156&-1)+($inc83_i<<2)|0;var $scevgep517518=$scevgep517;var $15=$inc83_i<<2;var $16=156-$15|0;_memset($scevgep517518,0,$16);var $sfb_169_i=$inc83_i;label=36;break;case 17:var $maxsf_074_i;var $sfb_073_i;var $m_o_072_i;var $j_071_i;var $i_070_i;var $arrayidx18_i=$10+4872+($sfb_073_i<<2)|0;var $17=HEAP32[$arrayidx18_i>>2];var $sub_i=$12-$j_071_i|0;var $add_i=$sub_i+1|0;var $cmp19_i=$17>>>0>$add_i>>>0;var $add__i=$cmp19_i?$add_i:$17;var $arrayidx20_i=$11+($j_071_i<<2)|0;var $shr_i_i=$add__i>>>2;var $and_i_i=$add__i&3;var $cmp23_i_i=($shr_i_i|0)==0;if($cmp23_i_i){var $xfsf_0_lcssa_i_i=0;var $xr34_addr_0_lcssa_i_i=$arrayidx20_i;label=20;break}else{var $xfsf_024_i_i=0;var $i_025_i_i=$shr_i_i;var $xr34_addr_026_i_i=$arrayidx20_i;label=18;break};case 18:var $xr34_addr_026_i_i;var $i_025_i_i;var $xfsf_024_i_i;var $dec_i_i=$i_025_i_i-1|0;var $18=HEAPF32[$xr34_addr_026_i_i>>2];var $cmp1_i_i=$xfsf_024_i_i<$18;var $xfsf_1_i_i=$cmp1_i_i?$18:$xfsf_024_i_i;var $arrayidx3_i_i=$xr34_addr_026_i_i+4|0;var $19=HEAPF32[$arrayidx3_i_i>>2];var $cmp4_i_i=$xfsf_1_i_i<$19;var $xfsf_2_i_i=$cmp4_i_i?$19:$xfsf_1_i_i;var $arrayidx8_i_i=$xr34_addr_026_i_i+8|0;var $20=HEAPF32[$arrayidx8_i_i>>2];var $cmp9_i_i=$xfsf_2_i_i<$20;var $xfsf_3_i_i=$cmp9_i_i?$20:$xfsf_2_i_i;var $arrayidx13_i_i=$xr34_addr_026_i_i+12|0;var $21=HEAPF32[$arrayidx13_i_i>>2];var $cmp14_i_i=$xfsf_3_i_i<$21;var $xfsf_4_i_i=$cmp14_i_i?$21:$xfsf_3_i_i;var $add_ptr_i_i=$xr34_addr_026_i_i+16|0;var $cmp_i_i=($dec_i_i|0)==0;if($cmp_i_i){label=19;break}else{var $xfsf_024_i_i=$xfsf_4_i_i;var $i_025_i_i=$dec_i_i;var $xr34_addr_026_i_i=$add_ptr_i_i;label=18;break};case 19:var $22=$shr_i_i<<2;var $arrayidx20_sum_i=$22+$j_071_i|0;var $scevgep_i_i=$11+($arrayidx20_sum_i<<2)|0;var $xfsf_0_lcssa_i_i=$xfsf_4_i_i;var $xr34_addr_0_lcssa_i_i=$scevgep_i_i;label=20;break;case 20:var $xr34_addr_0_lcssa_i_i;var $xfsf_0_lcssa_i_i;if(($and_i_i|0)==3){label=21;break}else if(($and_i_i|0)==2){var $xfsf_5_i_i=$xfsf_0_lcssa_i_i;label=23;break}else if(($and_i_i|0)==1){var $xfsf_6_i_i=$xfsf_0_lcssa_i_i;label=25;break}else{var $xfsf_7_i_i=$xfsf_0_lcssa_i_i;label=27;break};case 21:var $arrayidx18_i_i=$xr34_addr_0_lcssa_i_i+8|0;var $23=HEAPF32[$arrayidx18_i_i>>2];var $cmp19_i_i=$xfsf_0_lcssa_i_i<$23;if($cmp19_i_i){label=22;break}else{var $xfsf_5_i_i=$xfsf_0_lcssa_i_i;label=23;break};case 22:var $xfsf_5_i_i=$23;label=23;break;case 23:var $xfsf_5_i_i;var $arrayidx24_i_i=$xr34_addr_0_lcssa_i_i+4|0;var $24=HEAPF32[$arrayidx24_i_i>>2];var $cmp25_i_i=$xfsf_5_i_i<$24;if($cmp25_i_i){label=24;break}else{var $xfsf_6_i_i=$xfsf_5_i_i;label=25;break};case 24:var $xfsf_6_i_i=$24;label=25;break;case 25:var $xfsf_6_i_i;var $25=HEAPF32[$xr34_addr_0_lcssa_i_i>>2];var $cmp31_i_i=$xfsf_6_i_i<$25;if($cmp31_i_i){label=26;break}else{var $xfsf_7_i_i=$xfsf_6_i_i;label=27;break};case 26:var $xfsf_7_i_i=$25;label=27;break;case 27:var $xfsf_7_i_i;var $26=HEAPF32[95936>>2];var $mul_i_i=$xfsf_7_i_i*$26;var $cmp2_i_i=$mul_i_i>8206;var $sf_ok_1_i_i=$cmp2_i_i?-1:-128;var $conv6_i_i=$cmp2_i_i?-64:64;var $idxprom_1_i_i=$conv6_i_i&255;var $arrayidx_1_i_i=95424+($idxprom_1_i_i<<2)|0;var $27=HEAPF32[$arrayidx_1_i_i>>2];var $mul_1_i_i=$xfsf_7_i_i*$27;var $cmp2_1_i_i=$mul_1_i_i>8206;var $sub_sink_p_1_i_i=$cmp2_1_i_i?32:-32;var $sub_sink_1_i_i=$sub_sink_p_1_i_i+$conv6_i_i&255;var $sf_ok_1_1_i_i=$cmp2_1_i_i?$sf_ok_1_i_i:$conv6_i_i;var $idxprom_2_i_i=$sub_sink_1_i_i&255;var $arrayidx_2_i_i=95424+($idxprom_2_i_i<<2)|0;var $28=HEAPF32[$arrayidx_2_i_i>>2];var $mul_2_i_i=$xfsf_7_i_i*$28;var $cmp2_2_i_i=$mul_2_i_i>8206;var $sub_sink_p_2_i_i=$cmp2_2_i_i?16:-16;var $sub_sink_2_i_i=$sub_sink_p_2_i_i+$sub_sink_1_i_i&255;var $sf_ok_1_2_i_i=$cmp2_2_i_i?$sf_ok_1_1_i_i:$sub_sink_1_i_i;var $idxprom_3_i_i=$sub_sink_2_i_i&255;var $arrayidx_3_i_i=95424+($idxprom_3_i_i<<2)|0;var $29=HEAPF32[$arrayidx_3_i_i>>2];var $mul_3_i_i=$xfsf_7_i_i*$29;var $cmp2_3_i_i=$mul_3_i_i>8206;var $sub_sink_p_3_i_i=$cmp2_3_i_i?8:-8;var $sub_sink_3_i_i=$sub_sink_p_3_i_i+$sub_sink_2_i_i&255;var $sf_ok_1_3_i_i=$cmp2_3_i_i?$sf_ok_1_2_i_i:$sub_sink_2_i_i;var $idxprom_4_i_i=$sub_sink_3_i_i&255;var $arrayidx_4_i_i=95424+($idxprom_4_i_i<<2)|0;var $30=HEAPF32[$arrayidx_4_i_i>>2];var $mul_4_i_i=$xfsf_7_i_i*$30;var $cmp2_4_i_i=$mul_4_i_i>8206;var $sub_sink_p_4_i_i=$cmp2_4_i_i?4:-4;var $sub_sink_4_i_i=$sub_sink_p_4_i_i+$sub_sink_3_i_i&255;var $sf_ok_1_4_i_i=$cmp2_4_i_i?$sf_ok_1_3_i_i:$sub_sink_3_i_i;var $idxprom_5_i_i=$sub_sink_4_i_i&255;var $arrayidx_5_i_i=95424+($idxprom_5_i_i<<2)|0;var $31=HEAPF32[$arrayidx_5_i_i>>2];var $mul_5_i_i=$xfsf_7_i_i*$31;var $cmp2_5_i_i=$mul_5_i_i>8206;var $sub_sink_p_5_i_i=$cmp2_5_i_i?2:-2;var $sub_sink_5_i_i=$sub_sink_p_5_i_i+$sub_sink_4_i_i&255;var $sf_ok_1_5_i_i=$cmp2_5_i_i?$sf_ok_1_4_i_i:$sub_sink_4_i_i;var $idxprom_6_i_i=$sub_sink_5_i_i&255;var $arrayidx_6_i_i=95424+($idxprom_6_i_i<<2)|0;var $32=HEAPF32[$arrayidx_6_i_i>>2];var $mul_6_i_i=$xfsf_7_i_i*$32;var $cmp2_6_i_i=$mul_6_i_i>8206;var $sub_sink_p_6_i_i=$cmp2_6_i_i?1:-1;var $sub_sink_6_i_i=$sub_sink_p_6_i_i+$sub_sink_5_i_i&255;var $sf_ok_1_6_i_i=$cmp2_6_i_i?$sf_ok_1_5_i_i:$sub_sink_5_i_i;var $idxprom_7_i_i=$sub_sink_6_i_i&255;var $arrayidx_7_i_i=95424+($idxprom_7_i_i<<2)|0;var $33=HEAPF32[$arrayidx_7_i_i>>2];var $mul_7_i_i=$xfsf_7_i_i*$33;var $cmp2_7_i_i=$mul_7_i_i>8206;var $sf_ok_1_7_i_i=$cmp2_7_i_i?$sf_ok_1_6_i_i:$sub_sink_6_i_i;var $conv_i=$sf_ok_1_7_i_i&255;var $arrayidx22_i=$vbrsfmin_+($gr_1487*312&-1)+($ch_1482*156&-1)+($sfb_073_i<<2)|0;HEAP32[$arrayidx22_i>>2]=$conv_i;var $34=HEAP32[$mingain_l_i>>2];var $cmp25_i=($34|0)<($conv_i|0);if($cmp25_i){label=28;break}else{label=29;break};case 28:HEAP32[$mingain_l_i>>2]=$conv_i;label=29;break;case 29:var $arrayidx32_i=$that_+($gr_1487*72&-1)+($ch_1482*36&-1)+24+($i_070_i<<2)|0;var $35=HEAP32[$arrayidx32_i>>2];var $cmp34_i=($35|0)<($conv_i|0);if($cmp34_i){label=30;break}else{label=31;break};case 30:HEAP32[$arrayidx32_i>>2]=$conv_i;label=31;break;case 31:var $inc_i=$i_070_i+1|0;var $cmp41_i=$inc_i>>>0>2;var $_inc_i=$cmp41_i?0:$inc_i;var $cmp45_i=($sfb_073_i|0)<($13|0);var $cmp47_i=$17>>>0>2;var $or_cond_i=$cmp45_i&$cmp47_i;if($or_cond_i){label=32;break}else{label=34;break};case 32:var $arrayidx50_i=$sfb_073_i+($10+5212)|0;var $36=HEAP8[$arrayidx50_i];var $tobool_i=$36<<24>>24==0;if($tobool_i){var $m2_0_i=-1;var $maxsf_3_i=-1;var $m_o_1_i=$m_o_072_i;label=35;break}else{label=33;break};case 33:var $37=HEAP32[$find_i>>2];var $arrayidx52_i=$10+($j_071_i<<2)|0;var $arrayidx54_i=$l3_xmin+($gr_1487*312&-1)+($ch_1482*156&-1)+($sfb_073_i<<2)|0;var $38=HEAPF32[$arrayidx54_i>>2];var $call55_i=FUNCTION_TABLE[$37]($arrayidx52_i,$arrayidx20_i,$38,$add__i,$sf_ok_1_7_i_i);var $conv57_i=$call55_i&255;var $cmp58_i=($maxsf_074_i&255)<($call55_i&255);var $call55_maxsf_0_i=$cmp58_i?$call55_i:$maxsf_074_i;var $cmp63_i=($m_o_072_i|0)>=($conv57_i|0);var $cmp67_i=$call55_i<<24>>24==-1;var $or_cond66_i=$cmp63_i|$cmp67_i;var $m_o_0_conv57_i=$or_cond66_i?$m_o_072_i:$conv57_i;var $m2_0_i=$call55_i;var $maxsf_3_i=$call55_maxsf_0_i;var $m_o_1_i=$m_o_0_conv57_i;label=35;break;case 34:var $cmp76_i=($maxsf_074_i&255)<($sf_ok_1_7_i_i&255);var $call21_maxsf_0_i=$cmp76_i?$sf_ok_1_7_i_i:$maxsf_074_i;var $m2_0_i=$call21_maxsf_0_i;var $maxsf_3_i=$call21_maxsf_0_i;var $m_o_1_i=$m_o_072_i;label=35;break;case 35:var $m_o_1_i;var $maxsf_3_i;var $m2_0_i;var $conv81_i=$m2_0_i&255;var $arrayidx82_i=$sfwork_+($gr_1487*312&-1)+($ch_1482*156&-1)+($sfb_073_i<<2)|0;HEAP32[$arrayidx82_i>>2]=$conv81_i;var $inc83_i=$sfb_073_i+1|0;var $add84_i=$17+$j_071_i|0;var $cmp_i=$add84_i>>>0>$12>>>0;if($cmp_i){label=15;break}else{var $i_070_i=$_inc_i;var $j_071_i=$add84_i;var $m_o_072_i=$m_o_1_i;var $sfb_073_i=$inc83_i;var $maxsf_074_i=$maxsf_3_i;label=17;break};case 36:var $sfb_169_i;var $arrayidx88_i=$sfwork_+($gr_1487*312&-1)+($ch_1482*156&-1)+($sfb_169_i<<2)|0;HEAP32[$arrayidx88_i>>2]=$conv87_i;var $inc90_i=$sfb_169_i+1|0;var $cmp85_i=($inc90_i|0)<39;if($cmp85_i){var $sfb_169_i=$inc90_i;label=36;break}else{label=37;break};case 37:var $cmp91_i=($m_o_1_i|0)>-1;if($cmp91_i){var $sfb_267_i=0;label=38;break}else{var $maxsf_4_i=$maxsf_3_i;label=42;break};case 38:var $sfb_267_i;var $arrayidx99_i=$sfwork_+($gr_1487*312&-1)+($ch_1482*156&-1)+($sfb_267_i<<2)|0;var $39=HEAP32[$arrayidx99_i>>2];var $cmp100_i=($39|0)==255;if($cmp100_i){label=39;break}else{label=40;break};case 39:HEAP32[$arrayidx99_i>>2]=$m_o_1_i;label=40;break;case 40:var $inc106_i=$sfb_267_i+1|0;var $cmp96_i=($inc106_i|0)<39;if($cmp96_i){var $sfb_267_i=$inc106_i;label=38;break}else{label=41;break};case 41:var $conv94_i=$m_o_1_i&255;var $maxsf_4_i=$conv94_i;label=42;break;case 42:var $maxsf_4_i;var $conv109_i=$maxsf_4_i&255;var $alloc65=$arrayidx55|0;var $40=HEAP32[$alloc65>>2];FUNCTION_TABLE[$40]($arrayidx55,$arraydecay58,$scevgep,$conv109_i);var $gfc_i=$that_+($gr_1487*72&-1)+($ch_1482*36&-1)+12|0;var $41=HEAP32[$gfc_i>>2];var $42=HEAP32[$cod_info_i>>2];var $call_i=_scale_bitcount($41,$42);var $cmp_i320=($call_i|0)==0;if($cmp_i320){label=44;break}else{label=43;break};case 43:var $43=HEAP32[$gfc_i>>2];_lame_errorf($43,22064,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7>>3<<3,HEAP32[tempVarArgs>>2]=0,tempVarArgs));STACKTOP=tempVarArgs;_exit(-1);case 44:var $inc69=$ch_1482+1|0;var $cmp48=($inc69|0)<($2|0);if($cmp48){var $ch_1482=$inc69;label=13;break}else{label=45;break};case 45:var $inc72=$gr_1487+1|0;var $cmp45=($inc72|0)<($1|0);if($cmp45){var $gr_1487=$inc72;label=10;break}else{label=11;break};case 46:var $use_nbits_fr_0479;var $gr_2477;var $arrayidx77=$tmpcast314+($gr_2477<<2)|0;HEAP32[$arrayidx77>>2]=0;if($cmp79474){var $ch_2475=0;var $44=0;label=47;break}else{var $51=0;label=53;break};case 47:var $44;var $ch_2475;var $arrayidx85=$max_bits+($gr_2477<<3)+($ch_2475<<2)|0;var $45=HEAP32[$arrayidx85>>2];var $cmp86=($45|0)>0;if($cmp86){label=48;break}else{label=49;break};case 48:var $arrayidx83=$that_+($gr_2477*72&-1)+($ch_2475*36&-1)|0;var $cod_info88=$that_+($gr_2477*72&-1)+($ch_2475*36&-1)+16|0;var $46=HEAP32[$cod_info88>>2];var $arrayidx89=$46+2304|0;var $47=$arrayidx89;_memset($47,0,2304);var $call90=_quantizeAndCountBits($arrayidx83);label=49;break;case 49:_best_scalefac_store($gfc,$gr_2477,$ch_2475,$l3_side_i);var $48=HEAP32[$use_best_huffman_i>>2];var $cmp_i321=($48|0)==1;if($cmp_i321){label=50;break}else{label=51;break};case 50:var $arrayidx2_i=$gfc+304+($gr_2477*10504&-1)+($ch_2475*5252&-1)|0;_best_huffman_divide($gfc,$arrayidx2_i);label=51;break;case 51:var $part2_3_length_i=$gfc+304+($gr_2477*10504&-1)+($ch_2475*5252&-1)+4768|0;var $49=HEAP32[$part2_3_length_i>>2];var $part2_length_i=$gfc+304+($gr_2477*10504&-1)+($ch_2475*5252&-1)+4844|0;var $50=HEAP32[$part2_length_i>>2];var $add_i322=$50+$49|0;var $arrayidx95=$use_nbits_ch+($gr_2477<<3)+($ch_2475<<2)|0;HEAP32[$arrayidx95>>2]=$add_i322;var $add99=$44+$add_i322|0;var $inc101=$ch_2475+1|0;var $cmp79=($inc101|0)<($2|0);if($cmp79){var $ch_2475=$inc101;var $44=$add99;label=47;break}else{label=52;break};case 52:HEAP32[$arrayidx77>>2]=$add99;var $51=$add99;label=53;break;case 53:var $51;var $add104=$51+$use_nbits_fr_0479|0;var $inc106=$gr_2477+1|0;var $cmp75=($inc106|0)<($1|0);if($cmp75){var $gr_2477=$inc106;var $use_nbits_fr_0479=$add104;label=46;break}else{var $use_nbits_fr_0_lcssa=$add104;label=54;break};case 54:var $use_nbits_fr_0_lcssa;var $cmp108=($use_nbits_fr_0_lcssa|0)>($max_nbits_fr_1_lcssa|0);if($cmp108){label=61;break}else{label=55;break};case 55:if($cmp493){label=56;break}else{var $retval_0=$use_nbits_fr_0_lcssa;label=227;break};case 56:var $cmp118465=($2|0)>0;var $ok_0470=1;var $gr_3471=0;label=57;break;case 57:var $gr_3471;var $ok_0470;var $arrayidx113=$tmpcast314+($gr_3471<<2)|0;var $52=HEAP32[$arrayidx113>>2];var $cmp114=($52|0)>7680;var $_ok_0=$cmp114?0:$ok_0470;if($cmp118465){var $ok_2466=$_ok_0;var $ch_3467=0;label=58;break}else{var $ok_2_lcssa=$_ok_0;label=59;break};case 58:var $ch_3467;var $ok_2466;var $arrayidx121=$use_nbits_ch+($gr_3471<<3)+($ch_3467<<2)|0;var $53=HEAP32[$arrayidx121>>2];var $cmp122=($53|0)>4095;var $_ok_2=$cmp122?0:$ok_2466;var $inc126=$ch_3467+1|0;var $cmp118=($inc126|0)<($2|0);if($cmp118){var $ok_2466=$_ok_2;var $ch_3467=$inc126;label=58;break}else{var $ok_2_lcssa=$_ok_2;label=59;break};case 59:var $ok_2_lcssa;var $inc129=$gr_3471+1|0;var $cmp111=($inc129|0)<($1|0);if($cmp111){var $ok_0470=$ok_2_lcssa;var $gr_3471=$inc129;label=57;break}else{label=60;break};case 60:var $tobool=($ok_2_lcssa|0)==0;if($tobool){label=61;break}else{var $retval_0=$use_nbits_fr_0_lcssa;label=227;break};case 61:if($cmp493){label=62;break}else{var $sum_fr_0_lcssa=0;label=90;break};case 62:var $cmp139447=($2|0)>0;var $cmp202=($2|0)>1;var $sum_fr_0459=0;var $gr_4460=0;label=63;break;case 63:var $gr_4460;var $sum_fr_0459;var $arrayidx137=$tmpcast+($gr_4460<<2)|0;HEAP32[$arrayidx137>>2]=0;if($cmp139447){var $ch_4448=0;var $54=0;label=64;break}else{var $68=0;label=89;break};case 64:var $54;var $ch_4448;var $arrayidx142=$use_nbits_ch+($gr_4460<<3)+($ch_4448<<2)|0;var $55=HEAP32[$arrayidx142>>2];var $cmp143=($55|0)>4095;var $arrayidx146=$max_nbits_ch+($gr_4460<<3)+($ch_4448<<2)|0;var $_=$cmp143?4095:$55;HEAP32[$arrayidx146>>2]=$_;var $add156=$_+$54|0;var $inc158=$ch_4448+1|0;var $cmp139=($inc158|0)<($2|0);if($cmp139){var $ch_4448=$inc158;var $54=$add156;label=64;break}else{label=65;break};case 65:HEAP32[$arrayidx137>>2]=$add156;var $cmp161=($add156|0)>7680;if($cmp161){label=66;break}else{var $68=$add156;label=89;break};case 66:var $$etemp$6$0=0;var $$etemp$6$1=0;var $st$7$0=$f|0;HEAP32[$st$7$0>>2]=$$etemp$6$0;var $st$8$1=$f+4|0;HEAP32[$st$8$1>>2]=$$etemp$6$1;if($cmp139447){var $ch_5450=0;var $s_0451=0;label=67;break}else{label=77;break};case 67:var $s_0451;var $ch_5450;var $arrayidx167=$max_nbits_ch+($gr_4460<<3)+($ch_5450<<2)|0;var $56=HEAP32[$arrayidx167>>2];var $cmp168=($56|0)>0;if($cmp168){label=68;break}else{label=69;break};case 68:var $conv=$56|0;var $call172=Math.sqrt($conv);var $call173=Math.sqrt($call172);var $conv174=$call173;var $arrayidx175=$tmpcast317+($ch_5450<<2)|0;HEAPF32[$arrayidx175>>2]=$conv174;var $add177=$s_0451+$conv174;var $s_1=$add177;label=70;break;case 69:var $arrayidx179=$tmpcast317+($ch_5450<<2)|0;HEAPF32[$arrayidx179>>2]=0;var $s_1=$s_0451;label=70;break;case 70:var $s_1;var $inc182=$ch_5450+1|0;var $cmp164=($inc182|0)<($2|0);if($cmp164){var $ch_5450=$inc182;var $s_0451=$s_1;label=67;break}else{label=71;break};case 71:if($cmp139447){label=72;break}else{label=77;break};case 72:var $cmp188=$s_1>0;var $ch_6454=0;label=73;break;case 73:var $ch_6454;if($cmp188){label=74;break}else{label=75;break};case 74:var $arrayidx191=$tmpcast317+($ch_6454<<2)|0;var $57=HEAPF32[$arrayidx191>>2];var $mul=$57*7680;var $div=$mul/$s_1;var $conv192=$div&-1;var $arrayidx194=$max_nbits_ch+($gr_4460<<3)+($ch_6454<<2)|0;HEAP32[$arrayidx194>>2]=$conv192;label=76;break;case 75:var $arrayidx197=$max_nbits_ch+($gr_4460<<3)+($ch_6454<<2)|0;HEAP32[$arrayidx197>>2]=0;label=76;break;case 76:var $inc200=$ch_6454+1|0;var $cmp185=($inc200|0)<($2|0);if($cmp185){var $ch_6454=$inc200;label=73;break}else{label=77;break};case 77:if($cmp202){label=78;break}else{label=86;break};case 78:var $arrayidx206=$max_nbits_ch+($gr_4460<<3)|0;var $58=HEAP32[$arrayidx206>>2];var $arrayidx208=$use_nbits_ch+($gr_4460<<3)|0;var $59=HEAP32[$arrayidx208>>2];var $add209=$59+32|0;var $cmp210=($58|0)>($add209|0);var $arrayidx216=$max_nbits_ch+($gr_4460<<3)+4|0;var $60=HEAP32[$arrayidx216>>2];if($cmp210){label=79;break}else{var $62=$58;var $61=$60;label=80;break};case 79:var $add217=$60+$58|0;var $add220_neg=-32-$59|0;var $sub=$add220_neg+$add217|0;HEAP32[$arrayidx216>>2]=$sub;HEAP32[$arrayidx206>>2]=$add209;var $62=$add209;var $61=$sub;label=80;break;case 80:var $61;var $62;var $arrayidx230=$max_nbits_ch+($gr_4460<<3)+4|0;var $arrayidx232=$use_nbits_ch+($gr_4460<<3)+4|0;var $63=HEAP32[$arrayidx232>>2];var $add233=$63+32|0;var $cmp234=($61|0)>($add233|0);if($cmp234){label=81;break}else{var $65=$62;var $64=$61;label=82;break};case 81:var $add241=$62+$61|0;var $add244_neg=-32-$63|0;var $sub247=$add244_neg+$add241|0;HEAP32[$arrayidx206>>2]=$sub247;HEAP32[$arrayidx230>>2]=$add233;var $65=$sub247;var $64=$add233;label=82;break;case 82:var $64;var $65;var $cmp256=($65|0)>4095;if($cmp256){label=83;break}else{label=84;break};case 83:HEAP32[$arrayidx206>>2]=4095;label=84;break;case 84:var $cmp264=($64|0)>4095;if($cmp264){label=85;break}else{label=86;break};case 85:HEAP32[$arrayidx230>>2]=4095;label=86;break;case 86:HEAP32[$arrayidx137>>2]=0;if($cmp139447){var $ch_7456=0;var $66=0;label=87;break}else{var $68=0;label=89;break};case 87:var $66;var $ch_7456;var $arrayidx277=$max_nbits_ch+($gr_4460<<3)+($ch_7456<<2)|0;var $67=HEAP32[$arrayidx277>>2];var $add279=$66+$67|0;var $inc281=$ch_7456+1|0;var $cmp273=($inc281|0)<($2|0);if($cmp273){var $ch_7456=$inc281;var $66=$add279;label=87;break}else{label=88;break};case 88:HEAP32[$arrayidx137>>2]=$add279;var $68=$add279;label=89;break;case 89:var $68;var $add285=$68+$sum_fr_0459|0;var $inc287=$gr_4460+1|0;var $cmp135=($inc287|0)<($1|0);if($cmp135){var $sum_fr_0459=$add285;var $gr_4460=$inc287;label=63;break}else{var $sum_fr_0_lcssa=$add285;label=90;break};case 90:var $sum_fr_0_lcssa;var $cmp289=($sum_fr_0_lcssa|0)>($max_nbits_fr_1_lcssa|0);if($cmp289){label=93;break}else{label=91;break};case 91:if($cmp493){label=92;break}else{var $sum_fr_1_lcssa=0;var $ok_4_lcssa=0;label=141;break};case 92:var $cmp514414=($2|0)>0;var $sum_fr_1421=0;var $ok_4422=1;var $gr_9423=0;label=137;break;case 93:var $$etemp$9$0=0;var $$etemp$9$1=0;var $st$10$0=$f292|0;HEAP32[$st$10$0>>2]=$$etemp$9$0;var $st$11$1=$f292+4|0;HEAP32[$st$11$1>>2]=$$etemp$9$1;if($cmp493){var $gr_5444=0;var $s293_0445=0;label=96;break}else{var $sum_fr_1_lcssa=0;var $ok_4_lcssa=0;label=141;break};case 94:if($cmp493){label=95;break}else{var $sum_fr_1_lcssa=0;var $ok_4_lcssa=0;label=141;break};case 95:var $cmp319=$s293_1>0;var $conv322=$max_nbits_fr_1_lcssa|0;var $gr_6442=0;label=100;break;case 96:var $s293_0445;var $gr_5444;var $arrayidx298=$tmpcast+($gr_5444<<2)|0;var $69=HEAP32[$arrayidx298>>2];var $cmp299=($69|0)>0;if($cmp299){label=97;break}else{label=98;break};case 97:var $conv303=$69|0;var $call304=Math.sqrt($conv303);var $conv305=$call304;var $arrayidx306=$tmpcast315+($gr_5444<<2)|0;HEAPF32[$arrayidx306>>2]=$conv305;var $add308=$s293_0445+$conv305;var $s293_1=$add308;label=99;break;case 98:var $arrayidx310=$tmpcast315+($gr_5444<<2)|0;HEAPF32[$arrayidx310>>2]=0;var $s293_1=$s293_0445;label=99;break;case 99:var $s293_1;var $inc313=$gr_5444+1|0;var $cmp295=($inc313|0)<($1|0);if($cmp295){var $gr_5444=$inc313;var $s293_0445=$s293_1;label=96;break}else{label=94;break};case 100:var $gr_6442;if($cmp319){label=101;break}else{label=102;break};case 101:var $arrayidx323=$tmpcast315+($gr_6442<<2)|0;var $70=HEAPF32[$arrayidx323>>2];var $mul324=$conv322*$70;var $div325=$mul324/$s293_1;var $conv326=$div325&-1;var $arrayidx327=$tmpcast+($gr_6442<<2)|0;HEAP32[$arrayidx327>>2]=$conv326;label=103;break;case 102:var $arrayidx329=$tmpcast+($gr_6442<<2)|0;HEAP32[$arrayidx329>>2]=0;label=103;break;case 103:var $inc332=$gr_6442+1|0;var $cmp316=($inc332|0)<($1|0);if($cmp316){var $gr_6442=$inc332;label=100;break}else{label=104;break};case 104:var $cmp334=($1|0)>1;if($cmp334){label=107;break}else{label=105;break};case 105:if($cmp493){label=106;break}else{var $sum_fr_1_lcssa=0;var $ok_4_lcssa=0;label=141;break};case 106:var $cmp392427=($2|0)>0;var $cmp436=($2|0)>1;var $gr_8436=0;label=115;break;case 107:var $arrayidx337=$max_nbits_gr;var $71=HEAP32[$arrayidx337>>2];var $arrayidx338=$use_nbits_gr;var $72=HEAP32[$arrayidx338>>2];var $add339=$72+125|0;var $cmp340=($71|0)>($add339|0);var $arrayidx344=$tmpcast+4|0;var $73=HEAP32[$arrayidx344>>2];if($cmp340){label=108;break}else{var $75=$71;var $74=$73;label=109;break};case 108:var $add345=$73+$71|0;var $add347_neg=-125-$72|0;var $sub349=$add347_neg+$add345|0;HEAP32[$arrayidx344>>2]=$sub349;HEAP32[$arrayidx337>>2]=$add339;var $75=$add339;var $74=$sub349;label=109;break;case 109:var $74;var $75;var $arrayidx355=$tmpcast314+4|0;var $76=HEAP32[$arrayidx355>>2];var $add356=$76+125|0;var $cmp357=($74|0)>($add356|0);if($cmp357){label=110;break}else{label=111;break};case 110:var $arrayidx354=$tmpcast+4|0;var $add362=$75+$74|0;var $add364_neg=-125-$76|0;var $sub366=$add364_neg+$add362|0;HEAP32[$arrayidx337>>2]=$sub366;HEAP32[$arrayidx354>>2]=$add356;label=111;break;case 111:if($cmp493){var $gr_7440=0;label=112;break}else{var $sum_fr_1_lcssa=0;var $ok_4_lcssa=0;label=141;break};case 112:var $gr_7440;var $arrayidx375=$tmpcast+($gr_7440<<2)|0;var $77=HEAP32[$arrayidx375>>2];var $cmp376=($77|0)>7680;if($cmp376){label=113;break}else{label=114;break};case 113:HEAP32[$arrayidx375>>2]=7680;label=114;break;case 114:var $inc382=$gr_7440+1|0;var $cmp372=($inc382|0)<($1|0);if($cmp372){var $gr_7440=$inc382;label=112;break}else{label=105;break};case 115:var $gr_8436;var $$etemp$12$0=0;var $$etemp$12$1=0;var $st$13$0=$f389|0;HEAP32[$st$13$0>>2]=$$etemp$12$0;var $st$14$1=$f389+4|0;HEAP32[$st$14$1>>2]=$$etemp$12$1;if($cmp392427){var $ch_8428=0;var $s390_0429=0;label=116;break}else{label=126;break};case 116:var $s390_0429;var $ch_8428;var $arrayidx396=$max_nbits_ch+($gr_8436<<3)+($ch_8428<<2)|0;var $78=HEAP32[$arrayidx396>>2];var $cmp397=($78|0)>0;if($cmp397){label=117;break}else{label=118;break};case 117:var $conv402=$78|0;var $call403=Math.sqrt($conv402);var $conv404=$call403;var $arrayidx405=$tmpcast316+($ch_8428<<2)|0;HEAPF32[$arrayidx405>>2]=$conv404;var $add407=$s390_0429+$conv404;var $s390_1=$add407;label=119;break;case 118:var $arrayidx409=$tmpcast316+($ch_8428<<2)|0;HEAPF32[$arrayidx409>>2]=0;var $s390_1=$s390_0429;label=119;break;case 119:var $s390_1;var $inc412=$ch_8428+1|0;var $cmp392=($inc412|0)<($2|0);if($cmp392){var $ch_8428=$inc412;var $s390_0429=$s390_1;label=116;break}else{label=120;break};case 120:if($cmp392427){label=121;break}else{label=126;break};case 121:var $cmp418=$s390_1>0;var $arrayidx421=$tmpcast+($gr_8436<<2)|0;var $ch_9432=0;label=122;break;case 122:var $ch_9432;if($cmp418){label=123;break}else{label=124;break};case 123:var $79=HEAP32[$arrayidx421>>2];var $conv422=$79|0;var $arrayidx423=$tmpcast316+($ch_9432<<2)|0;var $80=HEAPF32[$arrayidx423>>2];var $mul424=$conv422*$80;var $div425=$mul424/$s390_1;var $conv426=$div425&-1;var $arrayidx428=$max_nbits_ch+($gr_8436<<3)+($ch_9432<<2)|0;HEAP32[$arrayidx428>>2]=$conv426;label=125;break;case 124:var $arrayidx431=$max_nbits_ch+($gr_8436<<3)+($ch_9432<<2)|0;HEAP32[$arrayidx431>>2]=0;label=125;break;case 125:var $inc434=$ch_9432+1|0;var $cmp415=($inc434|0)<($2|0);if($cmp415){var $ch_9432=$inc434;label=122;break}else{label=126;break};case 126:if($cmp436){label=127;break}else{label=136;break};case 127:var $arrayidx440=$max_nbits_ch+($gr_8436<<3)|0;var $81=HEAP32[$arrayidx440>>2];var $arrayidx442=$use_nbits_ch+($gr_8436<<3)|0;var $82=HEAP32[$arrayidx442>>2];var $add443=$82+32|0;var $cmp444=($81|0)>($add443|0);var $arrayidx450=$max_nbits_ch+($gr_8436<<3)+4|0;var $83=HEAP32[$arrayidx450>>2];if($cmp444){label=128;break}else{var $85=$81;var $84=$83;label=129;break};case 128:var $add451=$83+$81|0;var $add454_neg=-32-$82|0;var $sub457=$add454_neg+$add451|0;HEAP32[$arrayidx450>>2]=$sub457;HEAP32[$arrayidx440>>2]=$add443;var $85=$add443;var $84=$sub457;label=129;break;case 129:var $84;var $85;var $arrayidx467=$use_nbits_ch+($gr_8436<<3)+4|0;var $86=HEAP32[$arrayidx467>>2];var $add468=$86+32|0;var $cmp469=($84|0)>($add468|0);if($cmp469){label=130;break}else{var $87=$85;label=131;break};case 130:var $arrayidx465=$max_nbits_ch+($gr_8436<<3)+4|0;var $add476=$85+$84|0;var $add479_neg=-32-$86|0;var $sub482=$add479_neg+$add476|0;HEAP32[$arrayidx440>>2]=$sub482;HEAP32[$arrayidx465>>2]=$add468;var $87=$sub482;label=131;break;case 131:var $87;if($cmp392427){var $ch_10434=0;var $88=$87;label=132;break}else{label=136;break};case 132:var $88;var $ch_10434;var $cmp495=($88|0)>4095;if($cmp495){label=133;break}else{label=134;break};case 133:var $arrayidx494=$max_nbits_ch+($gr_8436<<3)+($ch_10434<<2)|0;HEAP32[$arrayidx494>>2]=4095;label=134;break;case 134:var $inc502=$ch_10434+1|0;var $cmp490=($inc502|0)<($2|0);if($cmp490){label=135;break}else{label=136;break};case 135:var $arrayidx494_phi_trans_insert=$max_nbits_ch+($gr_8436<<3)+($inc502<<2)|0;var $_pre530=HEAP32[$arrayidx494_phi_trans_insert>>2];var $ch_10434=$inc502;var $88=$_pre530;label=132;break;case 136:var $inc506=$gr_8436+1|0;var $cmp386=($inc506|0)<($1|0);if($cmp386){var $gr_8436=$inc506;label=115;break}else{label=91;break};case 137:var $gr_9423;var $ok_4422;var $sum_fr_1421;if($cmp514414){var $ok_5415=$ok_4422;var $ch_11416=0;var $sum_gr_0417=0;label=138;break}else{var $ok_5_lcssa=$ok_4422;var $sum_gr_0_lcssa=0;label=139;break};case 138:var $sum_gr_0417;var $ch_11416;var $ok_5415;var $arrayidx518=$max_nbits_ch+($gr_9423<<3)+($ch_11416<<2)|0;var $89=HEAP32[$arrayidx518>>2];var $add519=$89+$sum_gr_0417|0;var $cmp522=($89|0)>4095;var $_ok_5=$cmp522?0:$ok_5415;var $inc527=$ch_11416+1|0;var $cmp514=($inc527|0)<($2|0);if($cmp514){var $ok_5415=$_ok_5;var $ch_11416=$inc527;var $sum_gr_0417=$add519;label=138;break}else{var $ok_5_lcssa=$_ok_5;var $sum_gr_0_lcssa=$add519;label=139;break};case 139:var $sum_gr_0_lcssa;var $ok_5_lcssa;var $add529=$sum_gr_0_lcssa+$sum_fr_1421|0;var $cmp530=($sum_gr_0_lcssa|0)>7680;var $_ok_5318=$cmp530?0:$ok_5_lcssa;var $inc535=$gr_9423+1|0;var $cmp510=($inc535|0)<($1|0);if($cmp510){var $sum_fr_1421=$add529;var $ok_4422=$_ok_5318;var $gr_9423=$inc535;label=137;break}else{label=140;break};case 140:var $phitmp=($_ok_5318|0)==0;var $sum_fr_1_lcssa=$add529;var $ok_4_lcssa=$phitmp;label=141;break;case 141:var $ok_4_lcssa;var $sum_fr_1_lcssa;var $cmp537=($sum_fr_1_lcssa|0)>($max_nbits_fr_1_lcssa|0);var $tobool541=$cmp537|$ok_4_lcssa;var $brmerge_demorgan=$tobool541&$cmp493;if($brmerge_demorgan){label=142;break}else{label=145;break};case 142:var $cmp548409=($2|0)>0;if($cmp548409){label=143;break}else{var $cmp563407538=0;label=146;break};case 143:var $90=$2<<2;var $gr_10412_us=0;label=144;break;case 144:var $gr_10412_us;var $scevgep526=$max_bits+($gr_10412_us<<3)|0;var $scevgep524=$max_nbits_ch+($gr_10412_us<<3)|0;var $scevgep526527=$scevgep526;var $scevgep524525=$scevgep524;_memcpy($scevgep524525,$scevgep526527,$90)|0;var $inc559_us=$gr_10412_us+1|0;var $cmp544_us=($inc559_us|0)<($1|0);if($cmp544_us){var $gr_10412_us=$inc559_us;label=144;break}else{label=145;break};case 145:var $cmp563407=($2|0)>0;if($cmp563407){var $ch_13408=0;label=151;break}else{var $cmp563407538=0;label=146;break};case 146:var $cmp563407538;if($cmp493){label=147;break}else{var $use_nbits_fr_1_lcssa=0;label=225;break};case 147:if($cmp563407538){var $gr_11405_us=0;label=150;break}else{label=153;break};case 148:var $inc600_us=$gr_11405_us+1|0;var $cmp585_us=($inc600_us|0)<($1|0);if($cmp585_us){var $gr_11405_us=$inc600_us;label=150;break}else{label=152;break};case 149:var $ch_14403_us;var $scalefac_compress_us=$gfc+304+($gr_11405_us*10504&-1)+($ch_14403_us*5252&-1)+4784|0;HEAP32[$scalefac_compress_us>>2]=0;var $inc597_us=$ch_14403_us+1|0;var $cmp589_us=($inc597_us|0)<($2|0);if($cmp589_us){var $ch_14403_us=$inc597_us;label=149;break}else{label=148;break};case 150:var $gr_11405_us;var $ch_14403_us=0;label=149;break;case 151:var $ch_13408;var $arrayidx568=$gfc+21328+($ch_13408<<4)|0;var $inc582=$ch_13408+1|0;var $cmp563=($inc582|0)<($2|0);var $91=$arrayidx568;HEAP32[$91>>2]=0;HEAP32[$91+4>>2]=0;HEAP32[$91+8>>2]=0;HEAP32[$91+12>>2]=0;if($cmp563){var $ch_13408=$inc582;label=151;break}else{var $cmp563407538=$cmp563407;label=146;break};case 152:if($cmp493){label=153;break}else{var $use_nbits_fr_1_lcssa=0;label=225;break};case 153:var $arraydecay_i=$wrk_i|0;var $92=$sftemp_i_i_i;var $arraydecay_i39_i_i=$sftemp_i_i_i|0;var $l3_side_i348=$gfc+304|0;var $use_best_huffman_i349=$gfc+36|0;var $gr_12399=0;var $use_nbits_fr_1401=0;label=154;break;case 154:var $use_nbits_fr_1401;var $gr_12399;var $arrayidx606=$tmpcast314+($gr_12399<<2)|0;HEAP32[$arrayidx606>>2]=0;if($cmp563407538){var $ch_15386=0;var $93=0;label=155;break}else{var $168=0;label=224;break};case 155:var $93;var $ch_15386;var $arrayidx615=$use_nbits_ch+($gr_12399<<3)+($ch_15386<<2)|0;HEAP32[$arrayidx615>>2]=0;var $arrayidx617=$max_bits+($gr_12399<<3)+($ch_15386<<2)|0;var $94=HEAP32[$arrayidx617>>2];var $cmp618=($94|0)>0;if($cmp618){label=156;break}else{label=221;break};case 156:var $arraydecay624=$sfwork_+($gr_12399*312&-1)+($ch_15386*156&-1)|0;var $cod_info629=$that_+($gr_12399*72&-1)+($ch_15386*36&-1)+16|0;var $95=HEAP32[$cod_info629>>2];var $global_gain=$95+4780|0;var $96=HEAP32[$global_gain>>2];var $j_06_i=39;var $i_07_i=0;label=157;break;case 157:var $i_07_i;var $j_06_i;var $arrayidx_i=$sfwork_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_07_i<<2)|0;var $97=HEAP32[$arrayidx_i>>2];var $cmp1_i=($97|0)<($96|0);var $cond_i=$cmp1_i?$97:$96;HEAP32[$arrayidx_i>>2]=$cond_i;var $dec_i=$j_06_i-1|0;var $inc_i325=$i_07_i+1|0;var $cmp_i326=($dec_i|0)==0;if($cmp_i326){label=158;break}else{var $j_06_i=$dec_i;var $i_07_i=$inc_i325;label=157;break};case 158:var $arrayidx613=$that_+($gr_12399*72&-1)+($ch_15386*36&-1)|0;var $arrayidx631=$max_nbits_ch+($gr_12399<<3)+($ch_15386<<2)|0;var $98=HEAP32[$arrayidx631>>2];var $i_05_i_i=0;var $j_06_i_i=39;var $m_07_i_i=0;label=159;break;case 159:var $m_07_i_i;var $j_06_i_i;var $i_05_i_i;var $arrayidx_i_i=$sfwork_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_05_i_i<<2)|0;var $99=HEAP32[$arrayidx_i_i>>2];var $sub_i_i=255-$99|0;var $cmp1_i_i329=($m_07_i_i|0)<($sub_i_i|0);var $sub_m_0_i_i=$cmp1_i_i329?$sub_i_i:$m_07_i_i;var $dec_i_i330=$j_06_i_i-1|0;var $inc_i_i=$i_05_i_i+1|0;var $cmp_i_i331=($dec_i_i330|0)==0;if($cmp_i_i331){label=160;break}else{var $i_05_i_i=$inc_i_i;var $j_06_i_i=$dec_i_i330;var $m_07_i_i=$sub_m_0_i_i;label=159;break};case 160:var $arraydecay628=$vbrsfmin_+($gr_12399*312&-1)+($ch_15386*156&-1)|0;var $sfwork218_i=$arraydecay624;var $100=HEAP32[$global_gain>>2];var $cmp_i43_i=($sub_m_0_i_i|0)>0;var $alloc_i_i=$arrayidx613|0;var $gfc_i_i52_i=$that_+($gr_12399*72&-1)+($ch_15386*36&-1)+12|0;if($cmp_i43_i){var $bi_0_in_i_us=$sub_m_0_i_i;var $bi_ok_0_i_us=-1;var $bu_0_i_us=0;var $bo_0_i_us=$sub_m_0_i_i;label=166;break}else{var $bi_0_in_i=$sub_m_0_i_i;var $bi_ok_0_i=-1;var $bu_0_i=0;var $bo_0_i=$sub_m_0_i_i;label=167;break};case 161:var $i_025_i_i333_us;var $sfmax_024_i_i_us;var $j_023_i_i_us;var $arrayidx_i44_i_us=$sfwork_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_025_i_i333_us<<2)|0;var $101=HEAP32[$arrayidx_i44_i_us>>2];var $sub_i45_i_us=$100-$101|0;var $mul_i_i334_us=Math.imul($sub_i45_i_us,$bi_0_i_us)|0;var $div_i_i_us=($mul_i_i334_us|0)/($sub_m_0_i_i|0)&-1;var $add_i46_i_us=$div_i_i_us+$101|0;var $cmp3_i_i_us=($add_i46_i_us|0)<0;if($cmp3_i_i_us){var $x_0_i_i_us=0;label=163;break}else{label=162;break};case 162:var $cmp5_i_i_us=($add_i46_i_us|0)>255;var $_add_i_i_us=$cmp5_i_i_us?255:$add_i46_i_us;var $x_0_i_i_us=$_add_i_i_us;label=163;break;case 163:var $x_0_i_i_us;var $arrayidx8_i_i335_us=$wrk_i+($i_025_i_i333_us<<2)|0;HEAP32[$arrayidx8_i_i335_us>>2]=$x_0_i_i_us;var $cmp9_i_i336_us=($sfmax_024_i_i_us|0)<($x_0_i_i_us|0);var $x_0_sfmax_0_i_i_us=$cmp9_i_i336_us?$x_0_i_i_us:$sfmax_024_i_i_us;var $dec_i49_i_us=$j_023_i_i_us-1|0;var $inc_i50_i_us=$i_025_i_i333_us+1|0;var $cmp1_i51_i_us=($dec_i49_i_us|0)==0;if($cmp1_i51_i_us){label=164;break}else{var $j_023_i_i_us=$dec_i49_i_us;var $sfmax_024_i_i_us=$x_0_sfmax_0_i_i_us;var $i_025_i_i333_us=$inc_i50_i_us;label=161;break};case 164:var $102=HEAP32[$cod_info629>>2];var $xrpow_max1_i_i_us=$102+4764|0;var $103=HEAPF32[$xrpow_max1_i_i_us>>2];var $104=HEAP32[$alloc_i_i>>2];FUNCTION_TABLE[$104]($arrayidx613,$arraydecay_i,$arraydecay628,$x_0_sfmax_0_i_i_us);var $105=HEAP32[$gfc_i_i52_i>>2];var $106=HEAP32[$cod_info629>>2];var $call_i_i53_i_us=_scale_bitcount($105,$106);var $cmp_i_i54_i_us=($call_i_i53_i_us|0)==0;if($cmp_i_i54_i_us){label=165;break}else{label=170;break};case 165:var $call_i_i_us=_quantizeAndCountBits($arrayidx613);var $107=HEAP32[$cod_info629>>2];var $part2_length_i56_i_us=$107+4844|0;var $108=HEAP32[$part2_length_i56_i_us>>2];var $add_i57_i_us=$108+$call_i_i_us|0;var $xrpow_max4_i_i_us=$107+4764|0;HEAPF32[$xrpow_max4_i_i_us>>2]=$103;var $cmp_i338_us=($add_i57_i_us|0)>($98|0);var $sub_i339_us=$bi_0_i_us-1|0;var $add_i340_us=$bi_0_i_us+1|0;var $bo_1_i_us=$cmp_i338_us?$bo_0_i_us:$sub_i339_us;var $bu_1_i_us=$cmp_i338_us?$add_i340_us:$bu_0_i_us;var $bi_ok_1_i_us=$cmp_i338_us?$bi_ok_0_i_us:$bi_0_i_us;var $cmp4_i_us=($bu_1_i_us|0)>($bo_1_i_us|0);var $add6_i_us=$bu_1_i_us+$bo_1_i_us|0;if($cmp4_i_us){var $bi_0_i_lcssa365=$bi_0_i_us;var $bi_ok_1_i_lcssa=$bi_ok_1_i_us;label=172;break}else{var $bi_0_in_i_us=$add6_i_us;var $bi_ok_0_i_us=$bi_ok_1_i_us;var $bu_0_i_us=$bu_1_i_us;var $bo_0_i_us=$bo_1_i_us;label=166;break};case 166:var $bo_0_i_us;var $bu_0_i_us;var $bi_ok_0_i_us;var $bi_0_in_i_us;var $bi_0_i_us=($bi_0_in_i_us|0)/2&-1;var $j_023_i_i_us=39;var $sfmax_024_i_i_us=0;var $i_025_i_i333_us=0;label=161;break;case 167:var $bo_0_i;var $bu_0_i;var $bi_ok_0_i;var $bi_0_in_i;var $bi_0_i=($bi_0_in_i|0)/2&-1;_memcpy($0,$sfwork218_i,156)|0;var $j_127_i_i=39;var $sfmax_228_i_i=0;var $i_129_i_i=0;label=168;break;case 168:var $i_129_i_i;var $sfmax_228_i_i;var $j_127_i_i;var $arrayidx16_i_i=$sfwork_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_129_i_i<<2)|0;var $109=HEAP32[$arrayidx16_i_i>>2];var $cmp18_i_i=($sfmax_228_i_i|0)<($109|0);var $_sfmax_2_i_i=$cmp18_i_i?$109:$sfmax_228_i_i;var $dec22_i_i=$j_127_i_i-1|0;var $inc23_i_i=$i_129_i_i+1|0;var $cmp14_i_i337=($dec22_i_i|0)==0;if($cmp14_i_i337){label=169;break}else{var $j_127_i_i=$dec22_i_i;var $sfmax_228_i_i=$_sfmax_2_i_i;var $i_129_i_i=$inc23_i_i;label=168;break};case 169:var $110=HEAP32[$cod_info629>>2];var $xrpow_max1_i_i=$110+4764|0;var $111=HEAPF32[$xrpow_max1_i_i>>2];var $112=HEAP32[$alloc_i_i>>2];FUNCTION_TABLE[$112]($arrayidx613,$arraydecay_i,$arraydecay628,$_sfmax_2_i_i);var $113=HEAP32[$gfc_i_i52_i>>2];var $114=HEAP32[$cod_info629>>2];var $call_i_i53_i=_scale_bitcount($113,$114);var $cmp_i_i54_i=($call_i_i53_i|0)==0;if($cmp_i_i54_i){label=171;break}else{label=170;break};case 170:var $115=HEAP32[$gfc_i_i52_i>>2];_lame_errorf($115,22064,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7>>3<<3,HEAP32[tempVarArgs>>2]=0,tempVarArgs));STACKTOP=tempVarArgs;_exit(-1);case 171:var $call_i_i=_quantizeAndCountBits($arrayidx613);var $116=HEAP32[$cod_info629>>2];var $part2_length_i56_i=$116+4844|0;var $117=HEAP32[$part2_length_i56_i>>2];var $add_i57_i=$117+$call_i_i|0;var $xrpow_max4_i_i=$116+4764|0;HEAPF32[$xrpow_max4_i_i>>2]=$111;var $cmp_i338=($add_i57_i|0)>($98|0);var $sub_i339=$bi_0_i-1|0;var $add_i340=$bi_0_i+1|0;var $bo_1_i=$cmp_i338?$bo_0_i:$sub_i339;var $bu_1_i=$cmp_i338?$add_i340:$bu_0_i;var $bi_ok_1_i=$cmp_i338?$bi_ok_0_i:$bi_0_i;var $cmp4_i=($bu_1_i|0)>($bo_1_i|0);var $add6_i=$bu_1_i+$bo_1_i|0;if($cmp4_i){var $bi_0_i_lcssa365=$bi_0_i;var $bi_ok_1_i_lcssa=$bi_ok_1_i;label=172;break}else{var $bi_0_in_i=$add6_i;var $bi_ok_0_i=$bi_ok_1_i;var $bu_0_i=$bu_1_i;var $bo_0_i=$bo_1_i;label=167;break};case 172:var $bi_ok_1_i_lcssa;var $bi_0_i_lcssa365;var $cmp10_i=($bi_ok_1_i_lcssa|0)>-1;if($cmp10_i){label=173;break}else{label=183;break};case 173:var $cmp12_i=($bi_0_i_lcssa365|0)==($bi_ok_1_i_lcssa|0);if($cmp12_i){label=221;break}else{label=174;break};case 174:if($cmp_i43_i){var $j_023_i62_i=39;var $sfmax_024_i61_i=0;var $i_025_i60_i=0;label=176;break}else{label=175;break};case 175:_memcpy($0,$sfwork218_i,156)|0;var $j_127_i83_i=39;var $sfmax_228_i82_i=0;var $i_129_i81_i=0;label=179;break;case 176:var $i_025_i60_i;var $sfmax_024_i61_i;var $j_023_i62_i;var $arrayidx_i63_i=$sfwork_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_025_i60_i<<2)|0;var $118=HEAP32[$arrayidx_i63_i>>2];var $sub_i64_i=$100-$118|0;var $mul_i65_i=Math.imul($sub_i64_i,$bi_ok_1_i_lcssa)|0;var $div_i66_i=($mul_i65_i|0)/($sub_m_0_i_i|0)&-1;var $add_i67_i=$div_i66_i+$118|0;var $cmp3_i68_i=($add_i67_i|0)<0;if($cmp3_i68_i){var $x_0_i73_i=0;label=178;break}else{label=177;break};case 177:var $cmp5_i70_i=($add_i67_i|0)>255;var $_add_i71_i=$cmp5_i70_i?255:$add_i67_i;var $x_0_i73_i=$_add_i71_i;label=178;break;case 178:var $x_0_i73_i;var $arrayidx8_i74_i=$wrk_i+($i_025_i60_i<<2)|0;HEAP32[$arrayidx8_i74_i>>2]=$x_0_i73_i;var $cmp9_i75_i=($sfmax_024_i61_i|0)<($x_0_i73_i|0);var $x_0_sfmax_0_i76_i=$cmp9_i75_i?$x_0_i73_i:$sfmax_024_i61_i;var $dec_i77_i=$j_023_i62_i-1|0;var $inc_i78_i=$i_025_i60_i+1|0;var $cmp1_i79_i=($dec_i77_i|0)==0;if($cmp1_i79_i){var $sfmax_4_i92_i=$x_0_sfmax_0_i76_i;label=180;break}else{var $j_023_i62_i=$dec_i77_i;var $sfmax_024_i61_i=$x_0_sfmax_0_i76_i;var $i_025_i60_i=$inc_i78_i;label=176;break};case 179:var $i_129_i81_i;var $sfmax_228_i82_i;var $j_127_i83_i;var $arrayidx16_i84_i=$sfwork_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_129_i81_i<<2)|0;var $119=HEAP32[$arrayidx16_i84_i>>2];var $cmp18_i86_i=($sfmax_228_i82_i|0)<($119|0);var $_sfmax_2_i87_i=$cmp18_i86_i?$119:$sfmax_228_i82_i;var $dec22_i88_i=$j_127_i83_i-1|0;var $inc23_i89_i=$i_129_i81_i+1|0;var $cmp14_i90_i=($dec22_i88_i|0)==0;if($cmp14_i90_i){var $sfmax_4_i92_i=$_sfmax_2_i87_i;label=180;break}else{var $j_127_i83_i=$dec22_i88_i;var $sfmax_228_i82_i=$_sfmax_2_i87_i;var $i_129_i81_i=$inc23_i89_i;label=179;break};case 180:var $sfmax_4_i92_i;var $120=HEAP32[$cod_info629>>2];var $xrpow_max1_i95_i=$120+4764|0;var $121=HEAPF32[$xrpow_max1_i95_i>>2];var $122=HEAP32[$alloc_i_i>>2];FUNCTION_TABLE[$122]($arrayidx613,$arraydecay_i,$arraydecay628,$sfmax_4_i92_i);var $123=HEAP32[$gfc_i_i52_i>>2];var $124=HEAP32[$cod_info629>>2];var $call_i_i98_i=_scale_bitcount($123,$124);var $cmp_i_i99_i=($call_i_i98_i|0)==0;if($cmp_i_i99_i){label=182;break}else{label=181;break};case 181:var $125=HEAP32[$gfc_i_i52_i>>2];_lame_errorf($125,22064,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7>>3<<3,HEAP32[tempVarArgs>>2]=0,tempVarArgs));STACKTOP=tempVarArgs;_exit(-1);case 182:var $call_i101_i=_quantizeAndCountBits($arrayidx613);var $126=HEAP32[$cod_info629>>2];var $xrpow_max4_i104_i=$126+4764|0;HEAPF32[$xrpow_max4_i104_i>>2]=$121;label=221;break;case 183:var $add22_i=$100+255|0;var $bo26_0_i=255;var $bu25_0_i=$100;var $bi_ok24_0_i=-1;var $bi21_0_in_i=$add22_i;label=184;break;case 184:var $bi21_0_in_i;var $bi_ok24_0_i;var $bu25_0_i;var $bo26_0_i;var $bi21_0_i=($bi21_0_in_i|0)/2&-1;if($cmp_i43_i){label=185;break}else{label=187;break};case 185:var $cmp3_i114_i=($bi21_0_in_i|0)<-1;var $cmp5_i116_i=($bi21_0_i|0)>255;var $_add_i117_i=$cmp5_i116_i?255:$bi21_0_i;if($cmp3_i114_i){label=186;break}else{var $j_023_i110_i=39;var $sfmax_024_i109_i=0;var $i_025_i108_i=0;label=188;break};case 186:_memset($0,0,156);var $sfmax_4_i138_i=0;label=190;break;case 187:_memcpy($0,$sfwork218_i,156)|0;var $j_127_i129_i=39;var $sfmax_228_i128_i=0;var $i_129_i127_i=0;label=189;break;case 188:var $i_025_i108_i;var $sfmax_024_i109_i;var $j_023_i110_i;var $arrayidx8_i120_i=$wrk_i+($i_025_i108_i<<2)|0;HEAP32[$arrayidx8_i120_i>>2]=$_add_i117_i;var $cmp9_i121_i=($sfmax_024_i109_i|0)<($_add_i117_i|0);var $x_0_sfmax_0_i122_i=$cmp9_i121_i?$_add_i117_i:$sfmax_024_i109_i;var $dec_i123_i=$j_023_i110_i-1|0;var $inc_i124_i=$i_025_i108_i+1|0;var $cmp1_i125_i=($dec_i123_i|0)==0;if($cmp1_i125_i){var $sfmax_4_i138_i=$x_0_sfmax_0_i122_i;label=190;break}else{var $j_023_i110_i=$dec_i123_i;var $sfmax_024_i109_i=$x_0_sfmax_0_i122_i;var $i_025_i108_i=$inc_i124_i;label=188;break};case 189:var $i_129_i127_i;var $sfmax_228_i128_i;var $j_127_i129_i;var $arrayidx16_i130_i=$sfwork_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_129_i127_i<<2)|0;var $127=HEAP32[$arrayidx16_i130_i>>2];var $cmp18_i132_i=($sfmax_228_i128_i|0)<($127|0);var $_sfmax_2_i133_i=$cmp18_i132_i?$127:$sfmax_228_i128_i;var $dec22_i134_i=$j_127_i129_i-1|0;var $inc23_i135_i=$i_129_i127_i+1|0;var $cmp14_i136_i=($dec22_i134_i|0)==0;if($cmp14_i136_i){var $sfmax_4_i138_i=$_sfmax_2_i133_i;label=190;break}else{var $j_127_i129_i=$dec22_i134_i;var $sfmax_228_i128_i=$_sfmax_2_i133_i;var $i_129_i127_i=$inc23_i135_i;label=189;break};case 190:var $sfmax_4_i138_i;var $128=HEAP32[$cod_info629>>2];var $xrpow_max1_i141_i=$128+4764|0;var $129=HEAPF32[$xrpow_max1_i141_i>>2];var $130=HEAP32[$alloc_i_i>>2];FUNCTION_TABLE[$130]($arrayidx613,$arraydecay_i,$arraydecay628,$sfmax_4_i138_i);var $131=HEAP32[$gfc_i_i52_i>>2];var $132=HEAP32[$cod_info629>>2];var $call_i_i144_i=_scale_bitcount($131,$132);var $cmp_i_i145_i=($call_i_i144_i|0)==0;if($cmp_i_i145_i){label=192;break}else{label=191;break};case 191:var $133=HEAP32[$gfc_i_i52_i>>2];_lame_errorf($133,22064,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7>>3<<3,HEAP32[tempVarArgs>>2]=0,tempVarArgs));STACKTOP=tempVarArgs;_exit(-1);case 192:var $call_i147_i=_quantizeAndCountBits($arrayidx613);var $134=HEAP32[$cod_info629>>2];var $part2_length_i148_i=$134+4844|0;var $135=HEAP32[$part2_length_i148_i>>2];var $add_i149_i=$135+$call_i147_i|0;var $xrpow_max4_i150_i=$134+4764|0;HEAPF32[$xrpow_max4_i150_i>>2]=$129;var $cmp33_i=($add_i149_i|0)>($98|0);var $sub35_i=$bi21_0_i-1|0;var $add37_i=$bi21_0_i+1|0;var $bi_ok24_1_i=$cmp33_i?$bi_ok24_0_i:$bi21_0_i;var $bu25_1_i=$cmp33_i?$add37_i:$bu25_0_i;var $bo26_1_i=$cmp33_i?$bo26_0_i:$sub35_i;var $cmp39_i=($bu25_1_i|0)>($bo26_1_i|0);var $add41_i=$bu25_1_i+$bo26_1_i|0;if($cmp39_i){label=193;break}else{var $bo26_0_i=$bo26_1_i;var $bu25_0_i=$bu25_1_i;var $bi_ok24_0_i=$bi_ok24_1_i;var $bi21_0_in_i=$add41_i;label=184;break};case 193:var $cmp46_i=($bi_ok24_1_i|0)>-1;if($cmp46_i){label=194;break}else{label=204;break};case 194:var $cmp48_i=($bi21_0_i|0)==($bi_ok24_1_i|0);if($cmp48_i){label=221;break}else{label=195;break};case 195:if($cmp_i43_i){label=197;break}else{label=196;break};case 196:_memcpy($0,$sfwork218_i,156)|0;var $j_127_i175_i=39;var $sfmax_228_i174_i=0;var $i_129_i173_i=0;label=200;break;case 197:var $cmp3_i160_i=($bi_ok24_1_i|0)<0;var $cmp5_i162_i=($bi_ok24_1_i|0)>255;var $_add_i163_i=$cmp5_i162_i?255:$bi_ok24_1_i;if($cmp3_i160_i){label=198;break}else{var $j_023_i156_i=39;var $sfmax_024_i155_i=0;var $i_025_i154_i=0;label=199;break};case 198:_memset($0,0,156);var $sfmax_4_i184_i=0;label=201;break;case 199:var $i_025_i154_i;var $sfmax_024_i155_i;var $j_023_i156_i;var $arrayidx8_i166_i=$wrk_i+($i_025_i154_i<<2)|0;HEAP32[$arrayidx8_i166_i>>2]=$_add_i163_i;var $cmp9_i167_i=($sfmax_024_i155_i|0)<($_add_i163_i|0);var $x_0_sfmax_0_i168_i=$cmp9_i167_i?$_add_i163_i:$sfmax_024_i155_i;var $dec_i169_i=$j_023_i156_i-1|0;var $inc_i170_i=$i_025_i154_i+1|0;var $cmp1_i171_i=($dec_i169_i|0)==0;if($cmp1_i171_i){var $sfmax_4_i184_i=$x_0_sfmax_0_i168_i;label=201;break}else{var $j_023_i156_i=$dec_i169_i;var $sfmax_024_i155_i=$x_0_sfmax_0_i168_i;var $i_025_i154_i=$inc_i170_i;label=199;break};case 200:var $i_129_i173_i;var $sfmax_228_i174_i;var $j_127_i175_i;var $arrayidx16_i176_i=$sfwork_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_129_i173_i<<2)|0;var $136=HEAP32[$arrayidx16_i176_i>>2];var $cmp18_i178_i=($sfmax_228_i174_i|0)<($136|0);var $_sfmax_2_i179_i=$cmp18_i178_i?$136:$sfmax_228_i174_i;var $dec22_i180_i=$j_127_i175_i-1|0;var $inc23_i181_i=$i_129_i173_i+1|0;var $cmp14_i182_i=($dec22_i180_i|0)==0;if($cmp14_i182_i){var $sfmax_4_i184_i=$_sfmax_2_i179_i;label=201;break}else{var $j_127_i175_i=$dec22_i180_i;var $sfmax_228_i174_i=$_sfmax_2_i179_i;var $i_129_i173_i=$inc23_i181_i;label=200;break};case 201:var $sfmax_4_i184_i;var $137=HEAP32[$cod_info629>>2];var $xrpow_max1_i187_i=$137+4764|0;var $138=HEAPF32[$xrpow_max1_i187_i>>2];var $139=HEAP32[$alloc_i_i>>2];FUNCTION_TABLE[$139]($arrayidx613,$arraydecay_i,$arraydecay628,$sfmax_4_i184_i);var $140=HEAP32[$gfc_i_i52_i>>2];var $141=HEAP32[$cod_info629>>2];var $call_i_i190_i=_scale_bitcount($140,$141);var $cmp_i_i191_i=($call_i_i190_i|0)==0;if($cmp_i_i191_i){label=203;break}else{label=202;break};case 202:var $142=HEAP32[$gfc_i_i52_i>>2];_lame_errorf($142,22064,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7>>3<<3,HEAP32[tempVarArgs>>2]=0,tempVarArgs));STACKTOP=tempVarArgs;_exit(-1);case 203:var $call_i193_i=_quantizeAndCountBits($arrayidx613);var $143=HEAP32[$cod_info629>>2];var $xrpow_max4_i196_i=$143+4764|0;HEAPF32[$xrpow_max4_i196_i>>2]=$138;label=221;break;case 204:var $144=HEAP32[$cod_info629>>2];var $global_gain_i_i=$144+4780|0;var $145=HEAP32[$global_gain_i_i>>2];var $cmp6068_i_i=($145|0)>512;if($cmp6068_i_i){var $curr_0_lcssa_i_i=$145;var $gain_ok_0_lcssa_i_i=1024;label=215;break}else{label=205;break};case 205:var $part2_length_i_i=$144+4844|0;var $gain_ok_0_ph69_i_i=1024;var $l_0_ph70_i_i=$145;var $r_0_ph71_i_i=512;label=206;break;case 206:var $r_0_ph71_i_i;var $l_0_ph70_i_i;var $gain_ok_0_ph69_i_i;var $gain_ok_061_i_i=$gain_ok_0_ph69_i_i;var $r_062_i_i=$r_0_ph71_i_i;label=207;break;case 207:var $r_062_i_i;var $gain_ok_061_i_i;var $add_i_i=$r_062_i_i+$l_0_ph70_i_i|0;var $shr_i_i343=$add_i_i>>1;var $sub_i41_i=$shr_i_i343-$145|0;var $146=HEAP32[$cod_info629>>2];var $xrpow_max1_i_i_i=$146+4764|0;var $147=HEAPF32[$xrpow_max1_i_i_i>>2];var $i_018_i_i_i=0;var $vbrmax_019_i_i_i=0;label=208;break;case 208:var $vbrmax_019_i_i_i;var $i_018_i_i_i;var $arrayidx_i_i_i=$wrk_i+($i_018_i_i_i<<2)|0;var $148=HEAP32[$arrayidx_i_i_i>>2];var $add_i_i_i=$148+$sub_i41_i|0;var $arrayidx2_i_i_i=$vbrsfmin_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_018_i_i_i<<2)|0;var $149=HEAP32[$arrayidx2_i_i_i>>2];var $cmp3_i_i_i=($add_i_i_i|0)<($149|0);var $_add_i_i_i=$cmp3_i_i_i?$149:$add_i_i_i;var $cmp5_i_i_i=($_add_i_i_i|0)>255;var $gain_1_i_i_i=$cmp5_i_i_i?255:$_add_i_i_i;var $cmp8_i_i_i=($vbrmax_019_i_i_i|0)<($gain_1_i_i_i|0);var $gain_1_vbrmax_0_i_i_i=$cmp8_i_i_i?$gain_1_i_i_i:$vbrmax_019_i_i_i;var $arrayidx11_i_i_i=$sftemp_i_i_i+($i_018_i_i_i<<2)|0;HEAP32[$arrayidx11_i_i_i>>2]=$gain_1_i_i_i;var $inc_i_i_i=$i_018_i_i_i+1|0;var $cmp_i_i_i=($inc_i_i_i|0)<39;if($cmp_i_i_i){var $i_018_i_i_i=$inc_i_i_i;var $vbrmax_019_i_i_i=$gain_1_vbrmax_0_i_i_i;label=208;break}else{label=209;break};case 209:var $150=HEAP32[$alloc_i_i>>2];FUNCTION_TABLE[$150]($arrayidx613,$arraydecay_i39_i_i,$arraydecay628,$gain_1_vbrmax_0_i_i_i);var $151=HEAP32[$gfc_i_i52_i>>2];var $152=HEAP32[$cod_info629>>2];var $call_i44_i_i=_scale_bitcount($151,$152);var $cmp_i45_i_i=($call_i44_i_i|0)==0;if($cmp_i45_i_i){label=211;break}else{label=210;break};case 210:var $153=HEAP32[$gfc_i_i52_i>>2];_lame_errorf($153,22064,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7>>3<<3,HEAP32[tempVarArgs>>2]=0,tempVarArgs));STACKTOP=tempVarArgs;_exit(-1);case 211:var $call_i_i_i=_quantizeAndCountBits($arrayidx613);var $154=HEAP32[$cod_info629>>2];var $xrpow_max13_i_i_i=$154+4764|0;HEAPF32[$xrpow_max13_i_i_i>>2]=$147;var $cmp2_i_i345=($call_i_i_i|0)==0;if($cmp2_i_i345){label=213;break}else{label=212;break};case 212:var $155=HEAP32[$part2_length_i_i>>2];var $add3_i_i=$155+$call_i_i_i|0;var $cmp4_i_i346=($add3_i_i|0)<($98|0);if($cmp4_i_i346){label=213;break}else{label=214;break};case 213:var $sub5_i_i=$shr_i_i343-1|0;var $cmp_i42_i=($l_0_ph70_i_i|0)>($sub5_i_i|0);if($cmp_i42_i){label=221;break}else{var $gain_ok_061_i_i=$shr_i_i343;var $r_062_i_i=$sub5_i_i;label=207;break};case 214:var $add6_i_i=$shr_i_i343+1|0;var $cmp7_i_i=($gain_ok_061_i_i|0)==1024;var $shr_gain_ok_0_i_i=$cmp7_i_i?$shr_i_i343:$gain_ok_061_i_i;var $cmp60_i_i=($add6_i_i|0)>($r_062_i_i|0);if($cmp60_i_i){var $curr_0_lcssa_i_i=$shr_i_i343;var $gain_ok_0_lcssa_i_i=$shr_gain_ok_0_i_i;label=215;break}else{var $gain_ok_0_ph69_i_i=$shr_gain_ok_0_i_i;var $l_0_ph70_i_i=$add6_i_i;var $r_0_ph71_i_i=$r_062_i_i;label=206;break};case 215:var $gain_ok_0_lcssa_i_i;var $curr_0_lcssa_i_i;var $cmp10_i_i=($gain_ok_0_lcssa_i_i|0)==($curr_0_lcssa_i_i|0);if($cmp10_i_i){label=221;break}else{label=216;break};case 216:var $sub12_i_i=$gain_ok_0_lcssa_i_i-$145|0;var $156=HEAP32[$cod_info629>>2];var $xrpow_max1_i22_i_i=$156+4764|0;var $157=HEAPF32[$xrpow_max1_i22_i_i>>2];var $i_018_i24_i_i=0;var $vbrmax_019_i23_i_i=0;label=217;break;case 217:var $vbrmax_019_i23_i_i;var $i_018_i24_i_i;var $arrayidx_i25_i_i=$wrk_i+($i_018_i24_i_i<<2)|0;var $158=HEAP32[$arrayidx_i25_i_i>>2];var $add_i26_i_i=$158+$sub12_i_i|0;var $arrayidx2_i27_i_i=$vbrsfmin_+($gr_12399*312&-1)+($ch_15386*156&-1)+($i_018_i24_i_i<<2)|0;var $159=HEAP32[$arrayidx2_i27_i_i>>2];var $cmp3_i28_i_i=($add_i26_i_i|0)<($159|0);var $_add_i29_i_i=$cmp3_i28_i_i?$159:$add_i26_i_i;var $cmp5_i30_i_i=($_add_i29_i_i|0)>255;var $gain_1_i31_i_i=$cmp5_i30_i_i?255:$_add_i29_i_i;var $cmp8_i32_i_i=($vbrmax_019_i23_i_i|0)<($gain_1_i31_i_i|0);var $gain_1_vbrmax_0_i33_i_i=$cmp8_i32_i_i?$gain_1_i31_i_i:$vbrmax_019_i23_i_i;var $arrayidx11_i34_i_i=$sftemp_i_i_i+($i_018_i24_i_i<<2)|0;HEAP32[$arrayidx11_i34_i_i>>2]=$gain_1_i31_i_i;var $inc_i35_i_i=$i_018_i24_i_i+1|0;var $cmp_i36_i_i=($inc_i35_i_i|0)<39;if($cmp_i36_i_i){var $i_018_i24_i_i=$inc_i35_i_i;var $vbrmax_019_i23_i_i=$gain_1_vbrmax_0_i33_i_i;label=217;break}else{label=218;break};case 218:var $160=HEAP32[$alloc_i_i>>2];FUNCTION_TABLE[$160]($arrayidx613,$arraydecay_i39_i_i,$arraydecay628,$gain_1_vbrmax_0_i33_i_i);var $161=HEAP32[$gfc_i_i52_i>>2];var $162=HEAP32[$cod_info629>>2];var $call_i48_i_i=_scale_bitcount($161,$162);var $cmp_i49_i_i=($call_i48_i_i|0)==0;if($cmp_i49_i_i){label=220;break}else{label=219;break};case 219:var $163=HEAP32[$gfc_i_i52_i>>2];_lame_errorf($163,22064,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7>>3<<3,HEAP32[tempVarArgs>>2]=0,tempVarArgs));STACKTOP=tempVarArgs;_exit(-1);case 220:var $call_i40_i_i=_quantizeAndCountBits($arrayidx613);var $164=HEAP32[$cod_info629>>2];var $xrpow_max13_i41_i_i=$164+4764|0;HEAPF32[$xrpow_max13_i41_i_i>>2]=$157;label=221;break;case 221:_best_scalefac_store($gfc,$gr_12399,$ch_15386,$l3_side_i348);var $165=HEAP32[$use_best_huffman_i349>>2];var $cmp_i350=($165|0)==1;if($cmp_i350){label=222;break}else{label=223;break};case 222:var $arrayidx2_i351=$gfc+304+($gr_12399*10504&-1)+($ch_15386*5252&-1)|0;_best_huffman_divide($gfc,$arrayidx2_i351);label=223;break;case 223:var $part2_3_length_i353=$gfc+304+($gr_12399*10504&-1)+($ch_15386*5252&-1)+4768|0;var $166=HEAP32[$part2_3_length_i353>>2];var $part2_length_i354=$gfc+304+($gr_12399*10504&-1)+($ch_15386*5252&-1)+4844|0;var $167=HEAP32[$part2_length_i354>>2];var $add_i355=$167+$166|0;HEAP32[$arrayidx615>>2]=$add_i355;var $add639=$93+$add_i355|0;HEAP32[$arrayidx606>>2]=$add639;var $inc641=$ch_15386+1|0;var $cmp608=($inc641|0)<($2|0);if($cmp608){var $ch_15386=$inc641;var $93=$add639;label=155;break}else{var $168=$add639;label=224;break};case 224:var $168;var $add644=$168+$use_nbits_fr_1401|0;var $inc646=$gr_12399+1|0;var $cmp603=($inc646|0)<($1|0);if($cmp603){var $gr_12399=$inc646;var $use_nbits_fr_1401=$add644;label=154;break}else{var $use_nbits_fr_1_lcssa=$add644;label=225;break};case 225:var $use_nbits_fr_1_lcssa;var $cmp648=($use_nbits_fr_1_lcssa|0)>($max_nbits_fr_1_lcssa|0);if($cmp648){label=226;break}else{var $retval_0=$use_nbits_fr_1_lcssa;label=227;break};case 226:_lame_errorf($gfc,19960,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempVarArgs>>2]=$max_nbits_fr_1_lcssa,HEAP32[tempVarArgs+8>>2]=$use_nbits_fr_1_lcssa,tempVarArgs));STACKTOP=tempVarArgs;_exit(-1);case 227:var $retval_0;STACKTOP=sp;return $retval_0}}function _guess_scalefac_x34($xr,$xr34,$l3_xmin,$bw,$sf_min){var label=0;label=1;while(1)switch(label){case 1:var $conv_i=$bw|0;var $div_i=$l3_xmin/$conv_i;var $call_i=_log10($div_i);var $mul_i=$call_i*5.799142360687256;var $sub_i=$mul_i+ -.5;var $conv1_i=$sub_i&-1;var $add_i=$conv1_i+210|0;var $conv=$sf_min&255;var $cmp=($add_i|0)<($conv|0);if($cmp){label=3;break}else{label=2;break};case 2:var $cmp2=($add_i|0)>254;var $conv6=$add_i&255;var $_conv6=$cmp2?-1:$conv6;return $_conv6;case 3:return $sf_min}}function _find_scalefac_x34($xr,$xr34,$l3_xmin,$bw,$sf_min){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+2048|0;label=1;while(1)switch(label){case 1:var $did_it=sp;var $0=$did_it;_memset($0,0,2048);var $sf_ok_015=-1;var $delsf_016=64;var $seen_good_one_019=0;var $i_020=0;var $sf_021=-128;label=2;break;case 2:var $sf_021;var $i_020;var $seen_good_one_019;var $delsf_016;var $sf_ok_015;var $conv4=$sf_021&255;var $cmp6=($sf_021&255)>($sf_min&255);if($cmp6){label=4;break}else{label=3;break};case 3:var $add=$conv4+$delsf_016|0;var $conv10=$add&255;var $sf_1=$conv10;var $seen_good_one_1=$seen_good_one_019;var $sf_ok_1=$sf_ok_015;label=20;break;case 4:var $valid_i=$did_it+($conv4<<3)|0;var $1=HEAP32[$valid_i>>2];var $cmp_i=($1|0)==0;if($cmp_i){label=6;break}else{label=5;break};case 5:var $value8_phi_trans_insert_i=$did_it+($conv4<<3)+4|0;var $_pre_i=HEAPF32[$value8_phi_trans_insert_i>>2];var $2=$_pre_i;label=7;break;case 6:HEAP32[$valid_i>>2]=1;var $call_i=_calc_sfb_noise_x34($xr,$xr34,$bw,$sf_021);var $value_i=$did_it+($conv4<<3)+4|0;HEAPF32[$value_i>>2]=$call_i;var $2=$call_i;label=7;break;case 7:var $2;var $cmp9_i=$2>$l3_xmin;if($cmp9_i){label=18;break}else{label=8;break};case 8:var $cond_i=$sf_021<<24>>24==-1;if($cond_i){label=14;break}else{label=9;break};case 9:var $add_i=$sf_021+1&255;var $idxprom17_i=$add_i&255;var $valid19_i=$did_it+($idxprom17_i<<3)|0;var $3=HEAP32[$valid19_i>>2];var $cmp20_i=($3|0)==0;if($cmp20_i){label=11;break}else{label=10;break};case 10:var $value33_phi_trans_insert_i=$did_it+($idxprom17_i<<3)+4|0;var $_pre37_i=HEAPF32[$value33_phi_trans_insert_i>>2];var $4=$_pre37_i;label=12;break;case 11:HEAP32[$valid19_i>>2]=1;var $call26_i=_calc_sfb_noise_x34($xr,$xr34,$bw,$add_i);var $value29_i=$did_it+($idxprom17_i<<3)+4|0;HEAPF32[$value29_i>>2]=$call26_i;var $4=$call26_i;label=12;break;case 12:var $4;var $cmp34_i=$4>$l3_xmin;if($cmp34_i){label=18;break}else{label=13;break};case 13:var $cmp40_i=$sf_021<<24>>24==0;if($cmp40_i){label=19;break}else{label=14;break};case 14:var $sub_i=$sf_021-1&255;var $idxprom46_i=$sub_i&255;var $valid48_i=$did_it+($idxprom46_i<<3)|0;var $5=HEAP32[$valid48_i>>2];var $cmp49_i=($5|0)==0;if($cmp49_i){label=16;break}else{label=15;break};case 15:var $value62_phi_trans_insert_i=$did_it+($idxprom46_i<<3)+4|0;var $_pre36_i=HEAPF32[$value62_phi_trans_insert_i>>2];var $6=$_pre36_i;label=17;break;case 16:HEAP32[$valid48_i>>2]=1;var $call55_i=_calc_sfb_noise_x34($xr,$xr34,$bw,$sub_i);var $value58_i=$did_it+($idxprom46_i<<3)+4|0;HEAPF32[$value58_i>>2]=$call55_i;var $6=$call55_i;label=17;break;case 17:var $6;var $cmp63_i=$6>$l3_xmin;if($cmp63_i){label=18;break}else{label=19;break};case 18:var $sub=$conv4-$delsf_016|0;var $conv14=$sub&255;var $sf_1=$conv14;var $seen_good_one_1=$seen_good_one_019;var $sf_ok_1=$sf_ok_015;label=20;break;case 19:var $add18=$conv4+$delsf_016|0;var $conv19=$add18&255;var $sf_1=$conv19;var $seen_good_one_1=1;var $sf_ok_1=$sf_021;label=20;break;case 20:var $sf_ok_1;var $seen_good_one_1;var $sf_1;var $inc=$i_020+1&255;var $phitmp=$delsf_016>>1;var $cmp=($inc&255)<8;if($cmp){var $sf_ok_015=$sf_ok_1;var $delsf_016=$phitmp;var $seen_good_one_019=$seen_good_one_1;var $i_020=$inc;var $sf_021=$sf_1;label=2;break}else{label=21;break};case 21:var $cmp22=$seen_good_one_1<<24>>24==0;var $sf_0_sf_ok_0=$cmp22?$sf_1:$sf_ok_1;var $cmp28=($sf_0_sf_ok_0&255)>($sf_min&255);var $sf_3=$cmp28?$sf_0_sf_ok_0:$sf_min;STACKTOP=sp;return $sf_3}}function _short_block_constrain($that,$vbrsf,$vbrsfmin,$vbrmax){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+160|0;label=1;while(1)switch(label){case 1:var $sf_temp=sp;var $cod_info1=$that+16|0;var $0=HEAP32[$cod_info1>>2];var $gfc2=$that+12|0;var $1=HEAP32[$gfc2>>2];var $mingain_l=$that+20|0;var $2=HEAP32[$mingain_l>>2];var $psymax4=$0+4864|0;var $3=HEAP32[$psymax4>>2];var $cmp45=($3|0)>0;if($cmp45){var $delta_046=0;var $maxover1_047=0;var $maxover0_048=0;var $sfb_049=0;label=2;break}else{var $delta_0_lcssa=0;var $maxover1_0_lcssa=0;var $maxover0_0_lcssa=0;label=3;break};case 2:var $sfb_049;var $maxover0_048;var $maxover1_047;var $delta_046;var $arrayidx=$vbrsf+($sfb_049<<2)|0;var $4=HEAP32[$arrayidx>>2];var $sub=$vbrmax-$4|0;var $cmp5=($delta_046|0)<($sub|0);var $sub_delta_0=$cmp5?$sub:$delta_046;var $arrayidx6=$sfb_049+10712|0;var $5=HEAP8[$arrayidx6];var $conv=$5&255;var $mul=$conv<<1;var $add_neg=$sub-56|0;var $sub7=$add_neg-$mul|0;var $mul10=$conv<<2;var $sub12=$add_neg-$mul10|0;var $cmp13=($maxover0_048|0)<($sub7|0);var $maxover0_1=$cmp13?$sub7:$maxover0_048;var $cmp17=($maxover1_047|0)<($sub12|0);var $sub12_maxover1_0=$cmp17?$sub12:$maxover1_047;var $inc=$sfb_049+1|0;var $cmp=($inc|0)<($3|0);if($cmp){var $delta_046=$sub_delta_0;var $maxover1_047=$sub12_maxover1_0;var $maxover0_048=$maxover0_1;var $sfb_049=$inc;label=2;break}else{var $delta_0_lcssa=$sub_delta_0;var $maxover1_0_lcssa=$sub12_maxover1_0;var $maxover0_0_lcssa=$maxover0_1;label=3;break};case 3:var $maxover0_0_lcssa;var $maxover1_0_lcssa;var $delta_0_lcssa;var $noise_shaping=$1+28|0;var $6=HEAP32[$noise_shaping>>2];var $cmp21=($6|0)==2;if($cmp21){label=4;break}else{var $mover_0=$maxover0_0_lcssa;label=5;break};case 4:var $cmp24=($maxover0_0_lcssa|0)<($maxover1_0_lcssa|0);var $cond=$cmp24?$maxover0_0_lcssa:$maxover1_0_lcssa;var $mover_0=$cond;label=5;break;case 5:var $mover_0;var $cmp27=($delta_0_lcssa|0)>($mover_0|0);var $mover_0_delta_0=$cmp27?$mover_0:$delta_0_lcssa;var $sub31=$vbrmax-$mover_0_delta_0|0;var $cmp34=($maxover0_0_lcssa|0)==($mover_0|0);if($cmp34){label=6;break}else{label=7;break};case 6:var $scalefac_scale=$0+4836|0;HEAP32[$scalefac_scale>>2]=0;label=9;break;case 7:var $cmp38=($maxover1_0_lcssa|0)==($mover_0|0);if($cmp38){label=8;break}else{label=9;break};case 8:var $scalefac_scale41=$0+4836|0;HEAP32[$scalefac_scale41>>2]=1;label=9;break;case 9:var $cmp44=($sub31|0)<($2|0);var $_sub31=$cmp44?$2:$sub31;var $global_gain=$0+4780|0;HEAP32[$global_gain>>2]=$_sub31;var $cmp49=($_sub31|0)<0;if($cmp49){label=10;break}else{label=11;break};case 10:HEAP32[$global_gain>>2]=0;var $sfb_144=0;label=13;break;case 11:var $cmp55=($_sub31|0)>255;if($cmp55){label=12;break}else{var $sfb_144=0;label=13;break};case 12:HEAP32[$global_gain>>2]=255;var $sfb_144=0;label=13;break;case 13:var $sfb_144;var $arrayidx65=$vbrsf+($sfb_144<<2)|0;var $7=HEAP32[$arrayidx65>>2];var $sub66=$7-$_sub31|0;var $arrayidx67=$sf_temp+($sfb_144<<2)|0;HEAP32[$arrayidx67>>2]=$sub66;var $inc69=$sfb_144+1|0;var $cmp62=($inc69|0)<39;if($cmp62){var $sfb_144=$inc69;label=13;break}else{label=14;break};case 14:var $scalefac_scale_i=$0+4836|0;var $8=HEAP32[$scalefac_scale_i>>2];var $cmp_i=($8|0)==0;var $cond_i=$cmp_i?1:2;var $cmp2_i=$3>>>0<18;var $__i=$cmp2_i?$3:18;var $shl_i=15<<$cond_i;var $shl29_i=7<<$cond_i;var $min_sbg_090_i=7;var $i_091_i=0;label=15;break;case 15:var $i_091_i;var $min_sbg_090_i;var $cmp578_i=$i_091_i>>>0<$__i>>>0;if($cmp578_i){var $minsf_079_i=1e3;var $maxsf1_080_i=0;var $sfb_081_i=$i_091_i;label=16;break}else{var $minsf_0_lcssa_i=1e3;var $maxsf1_0_lcssa_i=0;var $sfb_0_lcssa_i=$i_091_i;label=17;break};case 16:var $sfb_081_i;var $maxsf1_080_i;var $minsf_079_i;var $arrayidx_i=$sf_temp+($sfb_081_i<<2)|0;var $9=HEAP32[$arrayidx_i>>2];var $sub_i=-$9|0;var $cmp7_i=($maxsf1_080_i|0)<($sub_i|0);var $sub_maxsf1_0_i=$cmp7_i?$sub_i:$maxsf1_080_i;var $cmp10_i=($minsf_079_i|0)>($sub_i|0);var $minsf_1_i=$cmp10_i?$sub_i:$minsf_079_i;var $add_i=$sfb_081_i+3|0;var $cmp5_i=$add_i>>>0<$__i>>>0;if($cmp5_i){var $minsf_079_i=$minsf_1_i;var $maxsf1_080_i=$sub_maxsf1_0_i;var $sfb_081_i=$add_i;label=16;break}else{var $minsf_0_lcssa_i=$minsf_1_i;var $maxsf1_0_lcssa_i=$sub_maxsf1_0_i;var $sfb_0_lcssa_i=$add_i;label=17;break};case 17:var $sfb_0_lcssa_i;var $maxsf1_0_lcssa_i;var $minsf_0_lcssa_i;var $cmp1484_i=$sfb_0_lcssa_i>>>0<39;if($cmp1484_i){var $minsf_285_i=$minsf_0_lcssa_i;var $maxsf2_086_i=0;var $sfb_187_i=$sfb_0_lcssa_i;label=18;break}else{var $minsf_2_lcssa_i=$minsf_0_lcssa_i;var $maxsf2_0_lcssa_i=0;label=19;break};case 18:var $sfb_187_i;var $maxsf2_086_i;var $minsf_285_i;var $arrayidx17_i=$sf_temp+($sfb_187_i<<2)|0;var $10=HEAP32[$arrayidx17_i>>2];var $sub18_i=-$10|0;var $cmp19_i=($maxsf2_086_i|0)<($sub18_i|0);var $sub18_maxsf2_0_i=$cmp19_i?$sub18_i:$maxsf2_086_i;var $cmp22_i=($minsf_285_i|0)>($sub18_i|0);var $minsf_3_i=$cmp22_i?$sub18_i:$minsf_285_i;var $add26_i=$sfb_187_i+3|0;var $cmp14_i=$add26_i>>>0<39;if($cmp14_i){var $minsf_285_i=$minsf_3_i;var $maxsf2_086_i=$sub18_maxsf2_0_i;var $sfb_187_i=$add26_i;label=18;break}else{var $minsf_2_lcssa_i=$minsf_3_i;var $maxsf2_0_lcssa_i=$sub18_maxsf2_0_i;label=19;break};case 19:var $maxsf2_0_lcssa_i;var $minsf_2_lcssa_i;var $sub28_i=$maxsf1_0_lcssa_i-$shl_i|0;var $sub30_i=$maxsf2_0_lcssa_i-$shl29_i|0;var $cmp31_i=($sub28_i|0)>($sub30_i|0);var $cond32_i=$cmp31_i?$sub28_i:$sub30_i;var $cmp33_i=($minsf_2_lcssa_i|0)>0;if($cmp33_i){label=20;break}else{label=21;break};case 20:var $shr_i=$minsf_2_lcssa_i>>3;var $arrayidx35_i=$0+4808+($i_091_i<<2)|0;HEAP32[$arrayidx35_i>>2]=$shr_i;var $11=$shr_i;label=22;break;case 21:var $arrayidx36_i=$0+4808+($i_091_i<<2)|0;HEAP32[$arrayidx36_i>>2]=0;var $11=0;label=22;break;case 22:var $11;var $cmp38_i=($cond32_i|0)>0;var $arrayidx41_i=$0+4808+($i_091_i<<2)|0;if($cmp38_i){label=23;break}else{var $_pr_i=$11;label=24;break};case 23:var $add43_i=$cond32_i+7|0;var $shr44_i=$add43_i>>3;var $cmp45_i=($11|0)>($shr44_i|0);var $cond49_i=$cmp45_i?$11:$shr44_i;HEAP32[$arrayidx41_i>>2]=$cond49_i;var $_pr_i=$cond49_i;label=24;break;case 24:var $_pr_i;var $cmp53_i=($_pr_i|0)>0;if($cmp53_i){label=25;break}else{var $15=$_pr_i;label=29;break};case 25:var $arrayidx54_i=$that+24+($i_091_i<<2)|0;var $12=HEAP32[$arrayidx54_i>>2];var $13=HEAP32[$global_gain>>2];var $mul_i=$_pr_i<<3;var $sub56_i=$13-$mul_i|0;var $cmp57_i=($12|0)>($sub56_i|0);if($cmp57_i){label=26;break}else{var $14=$_pr_i;label=27;break};case 26:var $sub61_i=$13-$12|0;var $shr62_i=$sub61_i>>3;HEAP32[$arrayidx41_i>>2]=$shr62_i;var $14=$shr62_i;label=27;break;case 27:var $14;var $cmp66_i=($14|0)>7;if($cmp66_i){label=28;break}else{var $15=$14;label=29;break};case 28:HEAP32[$arrayidx41_i>>2]=7;var $15=7;label=29;break;case 29:var $15;var $cmp71_i=($min_sbg_090_i|0)>($15|0);var $_min_sbg_0_i=$cmp71_i?$15:$min_sbg_090_i;var $inc_i=$i_091_i+1|0;var $cmp3_i=$inc_i>>>0<3;if($cmp3_i){var $min_sbg_090_i=$_min_sbg_0_i;var $i_091_i=$inc_i;label=15;break}else{label=30;break};case 30:var $arraydecay=$sf_temp|0;var $arraydecay_i=$0+4808|0;var $16=HEAP32[$arraydecay_i>>2];var $mul78_i=$16<<3;var $arrayidx79_i=$0+4812|0;var $17=HEAP32[$arrayidx79_i>>2];var $mul80_i=$17<<3;var $arrayidx81_i=$0+4816|0;var $18=HEAP32[$arrayidx81_i>>2];var $mul82_i=$18<<3;var $sfb_277_i=0;label=31;break;case 31:var $sfb_277_i;var $arrayidx87_i=$sf_temp+($sfb_277_i<<2)|0;var $19=HEAP32[$arrayidx87_i>>2];var $add88_i=$19+$mul78_i|0;HEAP32[$arrayidx87_i>>2]=$add88_i;var $add89_i=$sfb_277_i+1|0;var $arrayidx90_i=$sf_temp+($add89_i<<2)|0;var $20=HEAP32[$arrayidx90_i>>2];var $add91_i=$20+$mul80_i|0;HEAP32[$arrayidx90_i>>2]=$add91_i;var $add92_i=$sfb_277_i+2|0;var $arrayidx93_i=$sf_temp+($add92_i<<2)|0;var $21=HEAP32[$arrayidx93_i>>2];var $add94_i=$21+$mul82_i|0;HEAP32[$arrayidx93_i>>2]=$add94_i;var $add96_i=$sfb_277_i+3|0;var $cmp84_i=$add96_i>>>0<39;if($cmp84_i){var $sfb_277_i=$add96_i;label=31;break}else{label=32;break};case 32:var $cmp98_i=($_min_sbg_0_i|0)>0;if($cmp98_i){label=33;break}else{label=34;break};case 33:var $sub104_i=$16-$_min_sbg_0_i|0;HEAP32[$arraydecay_i>>2]=$sub104_i;var $sub104_1_i=$17-$_min_sbg_0_i|0;HEAP32[$arrayidx79_i>>2]=$sub104_1_i;var $sub104_2_i=$18-$_min_sbg_0_i|0;HEAP32[$arrayidx81_i>>2]=$sub104_2_i;var $mul108_i=$_min_sbg_0_i<<3;var $22=HEAP32[$global_gain>>2];var $sub110_i=$22-$mul108_i|0;HEAP32[$global_gain>>2]=$sub110_i;label=34;break;case 34:_set_scalefacs($0,$vbrsfmin,$arraydecay,10712);STACKTOP=sp;return}}function _long_block_constrain($that,$vbrsf,$vbrsfmin,$vbrmax){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+160|0;label=1;while(1)switch(label){case 1:var $sf_temp=sp;var $cod_info1=$that+16|0;var $0=HEAP32[$cod_info1>>2];var $gfc2=$that+12|0;var $1=HEAP32[$gfc2>>2];var $mingain_l=$that+20|0;var $2=HEAP32[$mingain_l>>2];var $psymax4=$0+4864|0;var $3=HEAP32[$psymax4>>2];var $mode_gr=$1+76|0;var $4=HEAP32[$mode_gr>>2];var $cmp=($4|0)==2;var $cond=$cmp?10872:10848;var $cmp5110=($3|0)>0;if($cmp5110){var $delta_0111=0;var $maxover1p_0112=0;var $maxover0p_0113=0;var $maxover1_0114=0;var $maxover0_0115=0;var $sfb_0116=0;label=2;break}else{var $delta_0_lcssa=0;var $maxover1p_0_lcssa=0;var $maxover0p_0_lcssa=0;var $maxover1_0_lcssa=0;var $maxover0_0_lcssa=0;label=3;break};case 2:var $sfb_0116;var $maxover0_0115;var $maxover1_0114;var $maxover0p_0113;var $maxover1p_0112;var $delta_0111;var $arrayidx=$vbrsf+($sfb_0116<<2)|0;var $5=HEAP32[$arrayidx>>2];var $sub=$vbrmax-$5|0;var $cmp6=($delta_0111|0)<($sub|0);var $sub_delta_0=$cmp6?$sub:$delta_0111;var $arrayidx7=$sfb_0116+10872|0;var $6=HEAP8[$arrayidx7];var $conv=$6&255;var $mul=$conv<<1;var $sub8=$sub-$mul|0;var $mul11=$conv<<2;var $sub12=$sub-$mul11|0;var $arrayidx13=$cond+$sfb_0116|0;var $7=HEAP8[$arrayidx13];var $conv14=$7&255;var $arrayidx15=9640+($sfb_0116<<2)|0;var $8=HEAP32[$arrayidx15>>2];var $add=$conv14+$8|0;var $mul16=$add<<1;var $sub17=$sub-$mul16|0;var $mul22=$add<<2;var $sub23=$sub-$mul22|0;var $cmp24=($maxover0_0115|0)<($sub8|0);var $maxover0_1=$cmp24?$sub8:$maxover0_0115;var $cmp28=($maxover1_0114|0)<($sub12|0);var $sub12_maxover1_0=$cmp28?$sub12:$maxover1_0114;var $cmp32=($maxover0p_0113|0)<($sub17|0);var $maxover0p_1=$cmp32?$sub17:$maxover0p_0113;var $cmp36=($maxover1p_0112|0)<($sub23|0);var $sub23_maxover1p_0=$cmp36?$sub23:$maxover1p_0112;var $inc=$sfb_0116+1|0;var $cmp5=($inc|0)<($3|0);if($cmp5){var $delta_0111=$sub_delta_0;var $maxover1p_0112=$sub23_maxover1p_0;var $maxover0p_0113=$maxover0p_1;var $maxover1_0114=$sub12_maxover1_0;var $maxover0_0115=$maxover0_1;var $sfb_0116=$inc;label=2;break}else{var $delta_0_lcssa=$sub_delta_0;var $maxover1p_0_lcssa=$sub23_maxover1p_0;var $maxover0p_0_lcssa=$maxover0p_1;var $maxover1_0_lcssa=$sub12_maxover1_0;var $maxover0_0_lcssa=$maxover0_1;label=3;break};case 3:var $maxover0_0_lcssa;var $maxover1_0_lcssa;var $maxover0p_0_lcssa;var $maxover1p_0_lcssa;var $delta_0_lcssa;var $sub43=$vbrmax-$maxover0p_0_lcssa|0;var $cmp44=($sub43|0)<($2|0);var $_sub43=$cmp44?$2:$sub43;var $sfb_1=0;label=4;break;case 4:var $sfb_1;var $cmp49=($sfb_1|0)<($3|0);if($cmp49){label=5;break}else{label=6;break};case 5:var $arrayidx52=$vbrsfmin+($sfb_1<<2)|0;var $9=HEAP32[$arrayidx52>>2];var $sub53=$_sub43-$9|0;var $arrayidx54=9640+($sfb_1<<2)|0;var $10=HEAP32[$arrayidx54>>2];var $mul55=$10<<1;var $sub56=$sub53-$mul55|0;var $cmp57=($sub56|0)<1;var $inc62=$sfb_1+1|0;if($cmp57){var $vm1p_1=$maxover1_0_lcssa;var $vm0p_0102=$maxover0_0_lcssa;label=9;break}else{var $sfb_1=$inc62;label=4;break};case 6:var $sub69=$vbrmax-$maxover1p_0_lcssa|0;var $cmp70=($sub69|0)<($2|0);var $_sub69=$cmp70?$2:$sub69;var $sfb_2=0;label=7;break;case 7:var $sfb_2;var $cmp75=($sfb_2|0)<($3|0);if($cmp75){label=8;break}else{var $vm1p_1=$maxover1p_0_lcssa;var $vm0p_0102=$maxover0p_0_lcssa;label=9;break};case 8:var $arrayidx78=$vbrsfmin+($sfb_2<<2)|0;var $11=HEAP32[$arrayidx78>>2];var $sub79=$_sub69-$11|0;var $arrayidx80=9640+($sfb_2<<2)|0;var $12=HEAP32[$arrayidx80>>2];var $mul81=$12<<2;var $sub82=$sub79-$mul81|0;var $cmp83=($sub82|0)<1;var $inc88=$sfb_2+1|0;if($cmp83){var $vm1p_1=$maxover1_0_lcssa;var $vm0p_0102=$maxover0p_0_lcssa;label=9;break}else{var $sfb_2=$inc88;label=7;break};case 9:var $vm0p_0102;var $vm1p_1;var $noise_shaping=$1+28|0;var $13=HEAP32[$noise_shaping>>2];var $cmp99=($13|0)==2;var $maxover1p_2_maxover0_0_maxover0p_0=$cmp99?$vm1p_1:$vm0p_0102;var $maxover1_0_maxover0_0=$cmp99?$maxover1_0_lcssa:$maxover0_0_lcssa;var $cmp103=($maxover0_0_lcssa|0)<($vm0p_0102|0);var $cond105=$cmp103?$maxover0_0_lcssa:$vm0p_0102;var $cmp106=($cond105|0)<($maxover1_0_maxover0_0|0);var $cond111=$cmp106?$cond105:$maxover1_0_maxover0_0;var $cmp112=($cond111|0)<($maxover1p_2_maxover0_0_maxover0p_0|0);var $cond117=$cmp112?$cond111:$maxover1p_2_maxover0_0_maxover0p_0;var $cmp118=($delta_0_lcssa|0)>($cond117|0);var $delta_2=$cmp118?$cond117:$delta_0_lcssa;var $sub122=$vbrmax-$delta_2|0;var $cmp123=($sub122|0)<($2|0);var $_sub122=$cmp123?$2:$sub122;var $cmp131=($maxover0_0_lcssa|0)==($cond117|0);if($cmp131){label=10;break}else{label=11;break};case 10:var $scalefac_scale=$0+4836|0;HEAP32[$scalefac_scale>>2]=0;var $preflag=$0+4832|0;HEAP32[$preflag>>2]=0;var $max_rangep_0=10872;label=17;break;case 11:var $cmp134=($vm0p_0102|0)==($cond117|0);if($cmp134){label=12;break}else{label=13;break};case 12:var $scalefac_scale137=$0+4836|0;HEAP32[$scalefac_scale137>>2]=0;var $preflag138=$0+4832|0;HEAP32[$preflag138>>2]=1;var $max_rangep_0=$cond;label=17;break;case 13:var $cmp140=($maxover1_0_maxover0_0|0)==($cond117|0);if($cmp140){label=14;break}else{label=15;break};case 14:var $scalefac_scale143=$0+4836|0;HEAP32[$scalefac_scale143>>2]=1;var $preflag144=$0+4832|0;HEAP32[$preflag144>>2]=0;var $max_rangep_0=10872;label=17;break;case 15:var $cmp146=($maxover1p_2_maxover0_0_maxover0p_0|0)==($cond117|0);if($cmp146){label=16;break}else{var $max_rangep_0=$cond;label=17;break};case 16:var $scalefac_scale149=$0+4836|0;HEAP32[$scalefac_scale149>>2]=1;var $preflag150=$0+4832|0;HEAP32[$preflag150>>2]=1;var $max_rangep_0=$cond;label=17;break;case 17:var $max_rangep_0;var $global_gain=$0+4780|0;HEAP32[$global_gain>>2]=$_sub122;var $cmp157=($_sub122|0)<0;if($cmp157){label=18;break}else{label=19;break};case 18:HEAP32[$global_gain>>2]=0;var $sfb_3107=0;label=21;break;case 19:var $cmp163=($_sub122|0)>255;if($cmp163){label=20;break}else{var $sfb_3107=0;label=21;break};case 20:HEAP32[$global_gain>>2]=255;var $sfb_3107=0;label=21;break;case 21:var $sfb_3107;var $arrayidx173=$vbrsf+($sfb_3107<<2)|0;var $14=HEAP32[$arrayidx173>>2];var $sub174=$14-$_sub122|0;var $arrayidx175=$sf_temp+($sfb_3107<<2)|0;HEAP32[$arrayidx175>>2]=$sub174;var $inc177=$sfb_3107+1|0;var $cmp170=($inc177|0)<39;if($cmp170){var $sfb_3107=$inc177;label=21;break}else{label=22;break};case 22:var $arraydecay=$sf_temp|0;_set_scalefacs($0,$vbrsfmin,$arraydecay,$max_rangep_0);STACKTOP=sp;return}}function _quantizeAndCountBits($that){var label=0;label=1;while(1)switch(label){case 1:var $that_idx=$that+8|0;var $that_idx_val=HEAP32[$that_idx>>2];var $that_idx5=$that+16|0;var $that_idx5_val=HEAP32[$that_idx5>>2];var $scalefac_scale_i=$that_idx5_val+4836|0;var $0=HEAP32[$scalefac_scale_i>>2];var $cmp_i=($0|0)==0;var $cond_i=$cmp_i?2:4;var $arraydecay_i=$that_idx5_val+2304|0;var $max_nonzero_coeff2_i=$that_idx5_val+5208|0;var $1=HEAP32[$max_nonzero_coeff2_i>>2];var $preflag_i=$that_idx5_val+4832|0;var $global_gain_i=$that_idx5_val+4780|0;var $2=-2-$1|0;var $sfb_018_i=0;var $j_019_i=0;var $l3_020_i=$arraydecay_i;var $xr34_orig_021_i=$that_idx_val;label=2;break;case 2:var $xr34_orig_021_i;var $l3_020_i;var $j_019_i;var $sfb_018_i;var $arrayidx_i=$that_idx5_val+4608+($sfb_018_i<<2)|0;var $3=HEAP32[$arrayidx_i>>2];var $4=HEAP32[$preflag_i>>2];var $tobool_i=($4|0)==0;if($tobool_i){var $cond5_i=0;label=4;break}else{label=3;break};case 3:var $arrayidx4_i=9640+($sfb_018_i<<2)|0;var $5=HEAP32[$arrayidx4_i>>2];var $cond5_i=$5;label=4;break;case 4:var $cond5_i;var $add_i=$cond5_i+$3|0;var $mul_i=Math.imul($add_i,$cond_i)|0;var $arrayidx6_i=$that_idx5_val+5028+($sfb_018_i<<2)|0;var $6=HEAP32[$arrayidx6_i>>2];var $arrayidx7_i=$that_idx5_val+4808+($6<<2)|0;var $7=HEAP32[$arrayidx7_i>>2];var $mul8_i=$7<<3;var $8=HEAP32[$global_gain_i>>2];var $sum=$mul8_i+$mul_i|0;var $sub_i=$8-$sum|0;var $idxprom_i=$sub_i&255;var $arrayidx10_i=95424+($idxprom_i<<2)|0;var $9=HEAPF32[$arrayidx10_i>>2];var $arrayidx11_i=$that_idx5_val+4872+($sfb_018_i<<2)|0;var $10=HEAP32[$arrayidx11_i>>2];var $sub12_i=$1-$j_019_i|0;var $add13_i=$sub12_i+1|0;var $add14_i=$10+$j_019_i|0;var $inc_i=$sfb_018_i+1|0;var $cmp15_i=$10>>>0<=$add13_i>>>0;var $cond20_i=$cmp15_i?$10:$add13_i;var $and_i=$cond20_i&3;var $shr_i=$cond20_i>>>2;var $cmp2213_i=($shr_i|0)==0;if($cmp2213_i){var $l3_1_lcssa_i=$l3_020_i;var $xr34_orig_1_lcssa_i=$xr34_orig_021_i;label=8;break}else{label=5;break};case 5:var $11=~$10;var $12=$j_019_i+$2|0;var $13=$12>>>0<$11>>>0;var $umax_i=$13?$11:$12;var $14=$umax_i&-4;var $15=$14^-4;var $l3_114_i=$l3_020_i;var $i_015_i=$shr_i;var $xr34_orig_116_i=$xr34_orig_021_i;label=6;break;case 6:var $xr34_orig_116_i;var $i_015_i;var $l3_114_i;var $dec_i=$i_015_i-1|0;var $16=HEAPF32[$xr34_orig_116_i>>2];var $mul26_i=$9*$16;var $conv27_i=$mul26_i;var $arrayidx29_i=$xr34_orig_116_i+4|0;var $17=HEAPF32[$arrayidx29_i>>2];var $mul30_i=$9*$17;var $conv31_i=$mul30_i;var $arrayidx33_i=$xr34_orig_116_i+8|0;var $18=HEAPF32[$arrayidx33_i>>2];var $mul34_i=$9*$18;var $conv35_i=$mul34_i;var $arrayidx37_i=$xr34_orig_116_i+12|0;var $19=HEAPF32[$arrayidx37_i>>2];var $mul38_i=$9*$19;var $conv39_i=$mul38_i;var $add_i_i=$conv27_i+8388608;var $conv_i_i=$add_i_i;var $20=(HEAPF32[tempDoublePtr>>2]=$conv_i_i,HEAP32[tempDoublePtr>>2]);var $add4_i_i=$conv31_i+8388608;var $conv6_i_i=$add4_i_i;var $21=(HEAPF32[tempDoublePtr>>2]=$conv6_i_i,HEAP32[tempDoublePtr>>2]);var $add10_i_i=$conv35_i+8388608;var $conv12_i_i=$add10_i_i;var $22=(HEAPF32[tempDoublePtr>>2]=$conv12_i_i,HEAP32[tempDoublePtr>>2]);var $add16_i_i=$conv39_i+8388608;var $conv18_i_i=$add16_i_i;var $23=(HEAPF32[tempDoublePtr>>2]=$conv18_i_i,HEAP32[tempDoublePtr>>2]);var $sub_i_i=$20-1258291200|0;var $arrayidx23_i_i=113864+($sub_i_i<<2)|0;var $24=HEAPF32[$arrayidx23_i_i>>2];var $conv24_i_i=$24;var $add25_i_i=$add_i_i+$conv24_i_i;var $conv26_i_i=$add25_i_i;var $25=(HEAPF32[tempDoublePtr>>2]=$conv26_i_i,HEAP32[tempDoublePtr>>2]);var $sub32_i_i=$21-1258291200|0;var $arrayidx33_i_i=113864+($sub32_i_i<<2)|0;var $26=HEAPF32[$arrayidx33_i_i>>2];var $conv34_i_i=$26;var $add35_i_i=$add4_i_i+$conv34_i_i;var $conv36_i_i=$add35_i_i;var $27=(HEAPF32[tempDoublePtr>>2]=$conv36_i_i,HEAP32[tempDoublePtr>>2]);var $sub42_i_i=$22-1258291200|0;var $arrayidx43_i_i=113864+($sub42_i_i<<2)|0;var $28=HEAPF32[$arrayidx43_i_i>>2];var $conv44_i_i=$28;var $add45_i_i=$add10_i_i+$conv44_i_i;var $conv46_i_i=$add45_i_i;var $29=(HEAPF32[tempDoublePtr>>2]=$conv46_i_i,HEAP32[tempDoublePtr>>2]);var $sub52_i_i=$23-1258291200|0;var $arrayidx53_i_i=113864+($sub52_i_i<<2)|0;var $30=HEAPF32[$arrayidx53_i_i>>2];var $conv54_i_i=$30;var $add55_i_i=$add16_i_i+$conv54_i_i;var $conv56_i_i=$add55_i_i;var $31=(HEAPF32[tempDoublePtr>>2]=$conv56_i_i,HEAP32[tempDoublePtr>>2]);var $sub61_i_i=$25-1258291200|0;HEAP32[$l3_114_i>>2]=$sub61_i_i;var $sub65_i_i=$27-1258291200|0;var $arrayidx66_i_i=$l3_114_i+4|0;HEAP32[$arrayidx66_i_i>>2]=$sub65_i_i;var $sub69_i_i=$29-1258291200|0;var $arrayidx70_i_i=$l3_114_i+8|0;HEAP32[$arrayidx70_i_i>>2]=$sub69_i_i;var $sub73_i_i=$31-1258291200|0;var $arrayidx74_i_i=$l3_114_i+12|0;HEAP32[$arrayidx74_i_i>>2]=$sub73_i_i;var $add_ptr_i=$l3_114_i+16|0;var $add_ptr42_i=$xr34_orig_116_i+16|0;var $cmp22_i=($dec_i|0)==0;if($cmp22_i){label=7;break}else{var $l3_114_i=$add_ptr_i;var $i_015_i=$dec_i;var $xr34_orig_116_i=$add_ptr42_i;label=6;break};case 7:var $scevgep_i=$xr34_orig_021_i+($15<<2)|0;var $scevgep22_i=$l3_020_i+($15<<2)|0;var $l3_1_lcssa_i=$scevgep22_i;var $xr34_orig_1_lcssa_i=$scevgep_i;label=8;break;case 8:var $xr34_orig_1_lcssa_i;var $l3_1_lcssa_i;if(($and_i|0)==2){var $x_sroa_2_16_load39_i=0;label=10;break}else if(($and_i|0)==1){var $x_sroa_1_8_load26_i=0;var $x_sroa_2_16_load38_i=0;label=11;break}else if(($and_i|0)==0){var $xr34_orig_0_be_i=$xr34_orig_1_lcssa_i;var $l3_0_be_i=$l3_1_lcssa_i;label=17;break}else if(($and_i|0)==3){label=9;break}else{var $conv275_i=8388608;var $x_sroa_1_8_load27_i=0;var $x_sroa_2_16_load310_i=0;label=12;break};case 9:var $arrayidx48_i=$xr34_orig_1_lcssa_i+8|0;var $32=HEAPF32[$arrayidx48_i>>2];var $mul49_i=$9*$32;var $conv50_i=$mul49_i;var $x_sroa_2_16_load39_i=$conv50_i;label=10;break;case 10:var $x_sroa_2_16_load39_i;var $arrayidx53_i=$xr34_orig_1_lcssa_i+4|0;var $33=HEAPF32[$arrayidx53_i>>2];var $mul54_i=$9*$33;var $conv55_i=$mul54_i;var $x_sroa_1_8_load26_i=$conv55_i;var $x_sroa_2_16_load38_i=$x_sroa_2_16_load39_i;label=11;break;case 11:var $x_sroa_2_16_load38_i;var $x_sroa_1_8_load26_i;var $34=HEAPF32[$xr34_orig_1_lcssa_i>>2];var $mul59_i=$9*$34;var $conv60_i=$mul59_i;var $phitmp_i=$conv60_i+8388608;var $conv275_i=$phitmp_i;var $x_sroa_1_8_load27_i=$x_sroa_1_8_load26_i;var $x_sroa_2_16_load310_i=$x_sroa_2_16_load38_i;label=12;break;case 12:var $x_sroa_2_16_load310_i;var $x_sroa_1_8_load27_i;var $conv275_i;var $conv_i46_i=$conv275_i;var $35=(HEAPF32[tempDoublePtr>>2]=$conv_i46_i,HEAP32[tempDoublePtr>>2]);var $add4_i48_i=$x_sroa_1_8_load27_i+8388608;var $conv6_i49_i=$add4_i48_i;var $36=(HEAPF32[tempDoublePtr>>2]=$conv6_i49_i,HEAP32[tempDoublePtr>>2]);var $add10_i51_i=$x_sroa_2_16_load310_i+8388608;var $sub_i56_i=$35-1258291200|0;var $arrayidx23_i57_i=113864+($sub_i56_i<<2)|0;var $37=HEAPF32[$arrayidx23_i57_i>>2];var $conv24_i58_i=$37;var $add25_i59_i=$conv275_i+$conv24_i58_i;var $conv26_i60_i=$add25_i59_i;var $38=(HEAPF32[tempDoublePtr>>2]=$conv26_i60_i,HEAP32[tempDoublePtr>>2]);var $sub32_i61_i=$36-1258291200|0;var $arrayidx33_i62_i=113864+($sub32_i61_i<<2)|0;var $39=HEAPF32[$arrayidx33_i62_i>>2];var $conv34_i63_i=$39;var $add35_i64_i=$add4_i48_i+$conv34_i63_i;var $conv36_i65_i=$add35_i64_i;var $40=(HEAPF32[tempDoublePtr>>2]=$conv36_i65_i,HEAP32[tempDoublePtr>>2]);var $sub61_i76_i=$38-1258291200|0;var $sub65_i77_i=$40-1258291200|0;if(($and_i|0)==3){label=13;break}else if(($and_i|0)==2){label=14;break}else if(($and_i|0)==1){label=15;break}else{label=16;break};case 13:var $conv12_i52_i=$add10_i51_i;var $41=(HEAPF32[tempDoublePtr>>2]=$conv12_i52_i,HEAP32[tempDoublePtr>>2]);var $sub42_i66_i=$41-1258291200|0;var $arrayidx43_i67_i=113864+($sub42_i66_i<<2)|0;var $42=HEAPF32[$arrayidx43_i67_i>>2];var $conv44_i68_i=$42;var $add45_i69_i=$add10_i51_i+$conv44_i68_i;var $conv46_i70_i=$add45_i69_i;var $43=(HEAPF32[tempDoublePtr>>2]=$conv46_i70_i,HEAP32[tempDoublePtr>>2]);var $sub69_i79_i=$43-1258291200|0;var $arrayidx66_i=$l3_1_lcssa_i+8|0;HEAP32[$arrayidx66_i>>2]=$sub69_i79_i;label=14;break;case 14:var $arrayidx69_i=$l3_1_lcssa_i+4|0;HEAP32[$arrayidx69_i>>2]=$sub65_i77_i;label=15;break;case 15:HEAP32[$l3_1_lcssa_i>>2]=$sub61_i76_i;label=16;break;case 16:var $add_ptr74_i=$l3_1_lcssa_i+($and_i<<2)|0;var $add_ptr75_i=$xr34_orig_1_lcssa_i+($and_i<<2)|0;var $xr34_orig_0_be_i=$add_ptr75_i;var $l3_0_be_i=$add_ptr74_i;label=17;break;case 17:var $l3_0_be_i;var $xr34_orig_0_be_i;var $cmp3_i=$add14_i>>>0>$1>>>0;if($cmp3_i){label=18;break}else{var $sfb_018_i=$inc_i;var $j_019_i=$add14_i;var $l3_020_i=$l3_0_be_i;var $xr34_orig_021_i=$xr34_orig_0_be_i;label=2;break};case 18:var $gfc=$that+12|0;var $44=HEAP32[$gfc>>2];var $45=HEAP32[$that_idx5>>2];var $call=_noquant_count_bits($44,$45,0);var $46=HEAP32[$that_idx5>>2];var $part2_3_length=$46+4768|0;HEAP32[$part2_3_length>>2]=$call;var $47=HEAP32[$that_idx5>>2];var $part2_3_length3=$47+4768|0;var $48=HEAP32[$part2_3_length3>>2];return $48}}function _set_scalefacs($cod_info,$vbrsfmin,$sf,$max_range){var label=0;label=1;while(1)switch(label){case 1:var $scalefac_scale=$cod_info+4836|0;var $0=HEAP32[$scalefac_scale>>2];var $cmp=($0|0)==0;var $cond=$cmp?2:4;var $cond3=$cmp?1:2;var $sfbmax5=$cod_info+4860|0;var $1=HEAP32[$sfbmax5>>2];var $preflag9=$cod_info+4832|0;var $2=HEAP32[$preflag9>>2];var $tobool=($2|0)!=0;var $cmp1052=($1|0)>11;var $or_cond57=$tobool&$cmp1052;if($or_cond57){var $sfb_053=11;label=4;break}else{label=2;break};case 2:var $cmp1350=($1|0)>0;if($cmp1350){label=3;break}else{var $sfb_1_lcssa56=0;label=6;break};case 3:var $global_gain=$cod_info+4780|0;var $sub28=$cond-1|0;var $sfb_151=0;label=7;break;case 4:var $sfb_053;var $arrayidx=9640+($sfb_053<<2)|0;var $3=HEAP32[$arrayidx>>2];var $mul=Math.imul($3,$cond)|0;var $arrayidx11=$sf+($sfb_053<<2)|0;var $4=HEAP32[$arrayidx11>>2];var $add=$4+$mul|0;HEAP32[$arrayidx11>>2]=$add;var $inc=$sfb_053+1|0;var $cmp10=($inc|0)<($1|0);if($cmp10){var $sfb_053=$inc;label=4;break}else{label=2;break};case 5:var $cmp5748=($1|0)<39;if($cmp5748){var $sfb_1_lcssa56=$1;label=6;break}else{label=16;break};case 6:var $sfb_1_lcssa56;var $5=$sfb_1_lcssa56+1152|0;var $scevgep=$cod_info+($5<<2)|0;var $scevgep54=$scevgep;var $6=$sfb_1_lcssa56<<2;var $7=156-$6|0;_memset($scevgep54,0,$7);label=16;break;case 7:var $sfb_151;var $8=HEAP32[$global_gain>>2];var $arrayidx15=$cod_info+5028+($sfb_151<<2)|0;var $9=HEAP32[$arrayidx15>>2];var $arrayidx16=$cod_info+4808+($9<<2)|0;var $10=HEAP32[$arrayidx16>>2];var $mul17=$10<<3;var $sub=$8-$mul17|0;if($tobool){label=8;break}else{var $cond20=0;label=9;break};case 8:var $arrayidx19=9640+($sfb_151<<2)|0;var $11=HEAP32[$arrayidx19>>2];var $cond20=$11;label=9;break;case 9:var $cond20;var $arrayidx23=$sf+($sfb_151<<2)|0;var $12=HEAP32[$arrayidx23>>2];var $cmp24=($12|0)<0;if($cmp24){label=10;break}else{label=14;break};case 10:var $mul21=Math.imul($cond20,$cond)|0;var $sub22=$sub-$mul21|0;var $arrayidx26=$vbrsfmin+($sfb_151<<2)|0;var $13=HEAP32[$arrayidx26>>2];var $sub27=$sub22-$13|0;var $sub30=$sub28-$12|0;var $shr=$sub30>>$cond3;var $arrayidx31=$cod_info+4608+($sfb_151<<2)|0;HEAP32[$arrayidx31>>2]=$shr;var $arrayidx33=$max_range+$sfb_151|0;var $14=HEAP8[$arrayidx33];var $conv=$14&255;var $cmp34=($shr|0)>($conv|0);if($cmp34){label=11;break}else{var $15=$shr;label=12;break};case 11:HEAP32[$arrayidx31>>2]=$conv;var $15=$conv;label=12;break;case 12:var $15;var $cmp42=($15|0)>0;var $shl=$15<<$cond3;var $cmp45=($shl|0)>($sub27|0);var $or_cond=$cmp42&$cmp45;if($or_cond){label=13;break}else{label=15;break};case 13:var $shr48=$sub27>>$cond3;HEAP32[$arrayidx31>>2]=$shr48;label=15;break;case 14:var $arrayidx51=$cod_info+4608+($sfb_151<<2)|0;HEAP32[$arrayidx51>>2]=0;label=15;break;case 15:var $inc54=$sfb_151+1|0;var $cmp13=($inc54|0)<($1|0);if($cmp13){var $sfb_151=$inc54;label=7;break}else{label=5;break};case 16:return}}function _calc_sfb_noise_x34($xr,$xr34,$bw,$sf){var label=0;label=1;while(1)switch(label){case 1:var $conv=$sf&255;var $add=$conv+116|0;var $arrayidx=61640+($add<<2)|0;var $0=HEAPF32[$arrayidx>>2];var $arrayidx1=95424+($conv<<2)|0;var $1=HEAPF32[$arrayidx1>>2];var $shr=$bw>>>2;var $and=$bw&3;var $cmp97=($shr|0)==0;if($cmp97){var $xr34_addr_0_lcssa=$xr34;var $xfsf_0_lcssa=0;var $xr_addr_0_lcssa=$xr;label=5;break}else{label=2;break};case 2:var $2=$shr<<2;var $scevgep=$xr34+($2<<2)|0;var $xr34_addr_098=$xr34;var $xfsf_099=0;var $i_0100=$shr;var $xr_addr_0101=$xr;label=3;break;case 3:var $xr_addr_0101;var $i_0100;var $xfsf_099;var $xr34_addr_098;var $dec=$i_0100-1|0;var $3=HEAPF32[$xr34_addr_098>>2];var $mul=$1*$3;var $conv4=$mul;var $arrayidx6=$xr34_addr_098+4|0;var $4=HEAPF32[$arrayidx6>>2];var $mul7=$1*$4;var $conv8=$mul7;var $arrayidx10=$xr34_addr_098+8|0;var $5=HEAPF32[$arrayidx10>>2];var $mul11=$1*$5;var $conv12=$mul11;var $arrayidx14=$xr34_addr_098+12|0;var $6=HEAPF32[$arrayidx14>>2];var $mul15=$1*$6;var $conv16=$mul15;var $add_i=$conv4+8388608;var $conv_i=$add_i;var $7=(HEAPF32[tempDoublePtr>>2]=$conv_i,HEAP32[tempDoublePtr>>2]);var $add4_i=$conv8+8388608;var $conv6_i=$add4_i;var $8=(HEAPF32[tempDoublePtr>>2]=$conv6_i,HEAP32[tempDoublePtr>>2]);var $add10_i=$conv12+8388608;var $conv12_i=$add10_i;var $9=(HEAPF32[tempDoublePtr>>2]=$conv12_i,HEAP32[tempDoublePtr>>2]);var $add16_i=$conv16+8388608;var $conv18_i=$add16_i;var $10=(HEAPF32[tempDoublePtr>>2]=$conv18_i,HEAP32[tempDoublePtr>>2]);var $sub_i=$7-1258291200|0;var $arrayidx23_i=113864+($sub_i<<2)|0;var $11=HEAPF32[$arrayidx23_i>>2];var $conv24_i=$11;var $add25_i=$add_i+$conv24_i;var $conv26_i=$add25_i;var $12=(HEAPF32[tempDoublePtr>>2]=$conv26_i,HEAP32[tempDoublePtr>>2]);var $sub32_i=$8-1258291200|0;var $arrayidx33_i=113864+($sub32_i<<2)|0;var $13=HEAPF32[$arrayidx33_i>>2];var $conv34_i=$13;var $add35_i=$add4_i+$conv34_i;var $conv36_i=$add35_i;var $14=(HEAPF32[tempDoublePtr>>2]=$conv36_i,HEAP32[tempDoublePtr>>2]);var $sub42_i=$9-1258291200|0;var $arrayidx43_i=113864+($sub42_i<<2)|0;var $15=HEAPF32[$arrayidx43_i>>2];var $conv44_i=$15;var $add45_i=$add10_i+$conv44_i;var $conv46_i=$add45_i;var $16=(HEAPF32[tempDoublePtr>>2]=$conv46_i,HEAP32[tempDoublePtr>>2]);var $sub52_i=$10-1258291200|0;var $arrayidx53_i=113864+($sub52_i<<2)|0;var $17=HEAPF32[$arrayidx53_i>>2];var $conv54_i=$17;var $add55_i=$add16_i+$conv54_i;var $conv56_i=$add55_i;var $18=(HEAPF32[tempDoublePtr>>2]=$conv56_i,HEAP32[tempDoublePtr>>2]);var $sub61_i=$12-1258291200|0;var $sub65_i=$14-1258291200|0;var $sub69_i=$16-1258291200|0;var $sub73_i=$18-1258291200|0;var $19=HEAPF32[$xr_addr_0101>>2];var $call=Math.abs($19);var $arrayidx21=28808+($sub61_i<<2)|0;var $20=HEAPF32[$arrayidx21>>2];var $mul22=$0*$20;var $sub=$call-$mul22;var $conv23=$sub;var $arrayidx25=$xr_addr_0101+4|0;var $21=HEAPF32[$arrayidx25>>2];var $call26=Math.abs($21);var $arrayidx28=28808+($sub65_i<<2)|0;var $22=HEAPF32[$arrayidx28>>2];var $mul29=$0*$22;var $sub30=$call26-$mul29;var $conv31=$sub30;var $arrayidx33=$xr_addr_0101+8|0;var $23=HEAPF32[$arrayidx33>>2];var $call34=Math.abs($23);var $arrayidx36=28808+($sub69_i<<2)|0;var $24=HEAPF32[$arrayidx36>>2];var $mul37=$0*$24;var $sub38=$call34-$mul37;var $conv39=$sub38;var $arrayidx41=$xr_addr_0101+12|0;var $25=HEAPF32[$arrayidx41>>2];var $call42=Math.abs($25);var $arrayidx44=28808+($sub73_i<<2)|0;var $26=HEAPF32[$arrayidx44>>2];var $mul45=$0*$26;var $sub46=$call42-$mul45;var $conv47=$sub46;var $mul51=$conv23*$conv23;var $mul54=$conv31*$conv31;var $add55=$mul51+$mul54;var $mul58=$conv39*$conv39;var $mul61=$conv47*$conv47;var $add62=$mul58+$mul61;var $add63=$add55+$add62;var $conv64=$xfsf_099;var $add65=$conv64+$add63;var $conv66=$add65;var $add_ptr=$xr_addr_0101+16|0;var $add_ptr67=$xr34_addr_098+16|0;var $cmp=($dec|0)==0;if($cmp){label=4;break}else{var $xr34_addr_098=$add_ptr67;var $xfsf_099=$conv66;var $i_0100=$dec;var $xr_addr_0101=$add_ptr;label=3;break};case 4:var $scevgep104=$xr+($2<<2)|0;var $xr34_addr_0_lcssa=$scevgep;var $xfsf_0_lcssa=$conv66;var $xr_addr_0_lcssa=$scevgep104;label=5;break;case 5:var $xr_addr_0_lcssa;var $xfsf_0_lcssa;var $xr34_addr_0_lcssa;if(($and|0)==0){var $xfsf_1=$xfsf_0_lcssa;label=14;break}else if(($and|0)==3){label=6;break}else if(($and|0)==2){var $x_sroa_2_16_load8292=0;label=7;break}else if(($and|0)==1){var $x_sroa_1_8_load7987=0;var $x_sroa_2_16_load8291=0;label=8;break}else{var $conv485=8388608;var $x_sroa_1_8_load7988=0;var $x_sroa_2_16_load8293=0;label=9;break};case 6:var $arrayidx72=$xr34_addr_0_lcssa+8|0;var $27=HEAPF32[$arrayidx72>>2];var $mul73=$1*$27;var $conv74=$mul73;var $x_sroa_2_16_load8292=$conv74;label=7;break;case 7:var $x_sroa_2_16_load8292;var $arrayidx77=$xr34_addr_0_lcssa+4|0;var $28=HEAPF32[$arrayidx77>>2];var $mul78=$1*$28;var $conv79=$mul78;var $x_sroa_1_8_load7987=$conv79;var $x_sroa_2_16_load8291=$x_sroa_2_16_load8292;label=8;break;case 8:var $x_sroa_2_16_load8291;var $x_sroa_1_8_load7987;var $29=HEAPF32[$xr34_addr_0_lcssa>>2];var $mul83=$1*$29;var $conv84=$mul83;var $phitmp=$conv84+8388608;var $conv485=$phitmp;var $x_sroa_1_8_load7988=$x_sroa_1_8_load7987;var $x_sroa_2_16_load8293=$x_sroa_2_16_load8291;label=9;break;case 9:var $x_sroa_2_16_load8293;var $x_sroa_1_8_load7988;var $conv485;var $conv_i34=$conv485;var $30=(HEAPF32[tempDoublePtr>>2]=$conv_i34,HEAP32[tempDoublePtr>>2]);var $add4_i36=$x_sroa_1_8_load7988+8388608;var $conv6_i37=$add4_i36;var $31=(HEAPF32[tempDoublePtr>>2]=$conv6_i37,HEAP32[tempDoublePtr>>2]);var $add10_i39=$x_sroa_2_16_load8293+8388608;var $sub_i44=$30-1258291200|0;var $arrayidx23_i45=113864+($sub_i44<<2)|0;var $32=HEAPF32[$arrayidx23_i45>>2];var $conv24_i46=$32;var $add25_i47=$conv485+$conv24_i46;var $conv26_i48=$add25_i47;var $33=(HEAPF32[tempDoublePtr>>2]=$conv26_i48,HEAP32[tempDoublePtr>>2]);var $sub32_i49=$31-1258291200|0;var $arrayidx33_i50=113864+($sub32_i49<<2)|0;var $34=HEAPF32[$arrayidx33_i50>>2];var $conv34_i51=$34;var $add35_i52=$add4_i36+$conv34_i51;var $conv36_i53=$add35_i52;var $35=(HEAPF32[tempDoublePtr>>2]=$conv36_i53,HEAP32[tempDoublePtr>>2]);var $sub61_i64=$33-1258291200|0;var $sub65_i65=$35-1258291200|0;if(($and|0)==3){label=10;break}else if(($and|0)==2){var $x_sroa_2_16_load8295=0;label=11;break}else if(($and|0)==1){var $x_sroa_1_8_load7989=0;var $x_sroa_2_16_load8294=0;label=12;break}else{var $conv486=0;var $x_sroa_1_8_load7990=0;var $x_sroa_2_16_load8296=0;label=13;break};case 10:var $conv12_i40=$add10_i39;var $36=(HEAPF32[tempDoublePtr>>2]=$conv12_i40,HEAP32[tempDoublePtr>>2]);var $sub42_i54=$36-1258291200|0;var $arrayidx43_i55=113864+($sub42_i54<<2)|0;var $37=HEAPF32[$arrayidx43_i55>>2];var $conv44_i56=$37;var $add45_i57=$add10_i39+$conv44_i56;var $conv46_i58=$add45_i57;var $38=(HEAPF32[tempDoublePtr>>2]=$conv46_i58,HEAP32[tempDoublePtr>>2]);var $sub69_i67=$38-1258291200|0;var $arrayidx93=$xr_addr_0_lcssa+8|0;var $39=HEAPF32[$arrayidx93>>2];var $call94=Math.abs($39);var $arrayidx96=28808+($sub69_i67<<2)|0;var $40=HEAPF32[$arrayidx96>>2];var $mul97=$0*$40;var $sub98=$call94-$mul97;var $conv99=$sub98;var $x_sroa_2_16_load8295=$conv99;label=11;break;case 11:var $x_sroa_2_16_load8295;var $arrayidx102=$xr_addr_0_lcssa+4|0;var $41=HEAPF32[$arrayidx102>>2];var $call103=Math.abs($41);var $arrayidx105=28808+($sub65_i65<<2)|0;var $42=HEAPF32[$arrayidx105>>2];var $mul106=$0*$42;var $sub107=$call103-$mul106;var $conv108=$sub107;var $x_sroa_1_8_load7989=$conv108;var $x_sroa_2_16_load8294=$x_sroa_2_16_load8295;label=12;break;case 12:var $x_sroa_2_16_load8294;var $x_sroa_1_8_load7989;var $43=HEAPF32[$xr_addr_0_lcssa>>2];var $call112=Math.abs($43);var $arrayidx114=28808+($sub61_i64<<2)|0;var $44=HEAPF32[$arrayidx114>>2];var $mul115=$0*$44;var $sub116=$call112-$mul115;var $conv117=$sub116;var $conv486=$conv117;var $x_sroa_1_8_load7990=$x_sroa_1_8_load7989;var $x_sroa_2_16_load8296=$x_sroa_2_16_load8294;label=13;break;case 13:var $x_sroa_2_16_load8296;var $x_sroa_1_8_load7990;var $conv486;var $mul122=$conv486*$conv486;var $mul125=$x_sroa_1_8_load7990*$x_sroa_1_8_load7990;var $add126=$mul125+$mul122;var $mul129=$x_sroa_2_16_load8296*$x_sroa_2_16_load8296;var $add133=$mul129;var $add134=$add133+$add126;var $conv135=$xfsf_0_lcssa;var $add136=$conv135+$add134;var $conv137=$add136;var $xfsf_1=$conv137;label=14;break;case 14:var $xfsf_1;return $xfsf_1}}function _get_lame_version(){return 19936}function _get_lame_short_version(){return 19936}function _get_lame_very_short_version(){return 22032}function _get_lame_tag_encoder_short_version(){return 20840}function _get_psy_version(){return 20416}function _get_lame_url(){return 19904}function _get_lame_version_numerical($lvp){HEAP32[$lvp>>2]=3;HEAP32[$lvp+4>>2]=99;HEAP32[$lvp+8>>2]=0;HEAP32[$lvp+12>>2]=0;HEAP32[$lvp+16>>2]=1;HEAP32[$lvp+20>>2]=0;HEAP32[$lvp+24>>2]=0;HEAP32[$lvp+28>>2]=0;HEAP32[$lvp+32>>2]=146696;return}function _get_lame_os_bitness(){return 19008}function _malloc($bytes){var label=0;label=1;while(1)switch(label){case 1:var $cmp=$bytes>>>0<245;if($cmp){label=2;break}else{label=78;break};case 2:var $cmp1=$bytes>>>0<11;if($cmp1){var $cond=16;label=4;break}else{label=3;break};case 3:var $add2=$bytes+11|0;var $and=$add2&-8;var $cond=$and;label=4;break;case 4:var $cond;var $shr=$cond>>>3;var $0=HEAP32[146728>>2];var $shr3=$0>>>($shr>>>0);var $and4=$shr3&3;var $cmp5=($and4|0)==0;if($cmp5){label=12;break}else{label=5;break};case 5:var $neg=$shr3&1;var $and7=$neg^1;var $add8=$and7+$shr|0;var $shl=$add8<<1;var $arrayidx=146768+($shl<<2)|0;var $1=$arrayidx;var $arrayidx_sum=$shl+2|0;var $2=146768+($arrayidx_sum<<2)|0;var $3=HEAP32[$2>>2];var $fd9=$3+8|0;var $4=HEAP32[$fd9>>2];var $cmp10=($1|0)==($4|0);if($cmp10){label=6;break}else{label=7;break};case 6:var $shl12=1<<$add8;var $neg13=~$shl12;var $and14=$0&$neg13;HEAP32[146728>>2]=$and14;label=11;break;case 7:var $5=$4;var $6=HEAP32[146744>>2];var $cmp15=$5>>>0<$6>>>0;if($cmp15){label=10;break}else{label=8;break};case 8:var $bk=$4+12|0;var $7=HEAP32[$bk>>2];var $cmp16=($7|0)==($3|0);if($cmp16){label=9;break}else{label=10;break};case 9:HEAP32[$bk>>2]=$1;HEAP32[$2>>2]=$4;label=11;break;case 10:_abort();case 11:var $shl22=$add8<<3;var $or23=$shl22|3;var $head=$3+4|0;HEAP32[$head>>2]=$or23;var $8=$3;var $add_ptr_sum106=$shl22|4;var $head25=$8+$add_ptr_sum106|0;var $9=$head25;var $10=HEAP32[$9>>2];var $or26=$10|1;HEAP32[$9>>2]=$or26;var $11=$fd9;var $mem_0=$11;label=341;break;case 12:var $12=HEAP32[146736>>2];var $cmp29=$cond>>>0>$12>>>0;if($cmp29){label=13;break}else{var $nb_0=$cond;label=160;break};case 13:var $cmp31=($shr3|0)==0;if($cmp31){label=27;break}else{label=14;break};case 14:var $shl35=$shr3<<$shr;var $shl37=2<<$shr;var $sub=-$shl37|0;var $or40=$shl37|$sub;var $and41=$shl35&$or40;var $sub42=-$and41|0;var $and43=$and41&$sub42;var $sub44=$and43-1|0;var $shr45=$sub44>>>12;var $and46=$shr45&16;var $shr47=$sub44>>>($and46>>>0);var $shr48=$shr47>>>5;var $and49=$shr48&8;var $add50=$and49|$and46;var $shr51=$shr47>>>($and49>>>0);var $shr52=$shr51>>>2;var $and53=$shr52&4;var $add54=$add50|$and53;var $shr55=$shr51>>>($and53>>>0);var $shr56=$shr55>>>1;var $and57=$shr56&2;var $add58=$add54|$and57;var $shr59=$shr55>>>($and57>>>0);var $shr60=$shr59>>>1;var $and61=$shr60&1;var $add62=$add58|$and61;var $shr63=$shr59>>>($and61>>>0);var $add64=$add62+$shr63|0;var $shl65=$add64<<1;var $arrayidx66=146768+($shl65<<2)|0;var $13=$arrayidx66;var $arrayidx66_sum=$shl65+2|0;var $14=146768+($arrayidx66_sum<<2)|0;var $15=HEAP32[$14>>2];var $fd69=$15+8|0;var $16=HEAP32[$fd69>>2];var $cmp70=($13|0)==($16|0);if($cmp70){label=15;break}else{label=16;break};case 15:var $shl72=1<<$add64;var $neg73=~$shl72;var $and74=$0&$neg73;HEAP32[146728>>2]=$and74;label=20;break;case 16:var $17=$16;var $18=HEAP32[146744>>2];var $cmp76=$17>>>0<$18>>>0;if($cmp76){label=19;break}else{label=17;break};case 17:var $bk78=$16+12|0;var $19=HEAP32[$bk78>>2];var $cmp79=($19|0)==($15|0);if($cmp79){label=18;break}else{label=19;break};case 18:HEAP32[$bk78>>2]=$13;HEAP32[$14>>2]=$16;label=20;break;case 19:_abort();case 20:var $shl90=$add64<<3;var $sub91=$shl90-$cond|0;var $or93=$cond|3;var $head94=$15+4|0;HEAP32[$head94>>2]=$or93;var $20=$15;var $add_ptr95=$20+$cond|0;var $21=$add_ptr95;var $or96=$sub91|1;var $add_ptr95_sum103=$cond|4;var $head97=$20+$add_ptr95_sum103|0;var $22=$head97;HEAP32[$22>>2]=$or96;var $add_ptr98=$20+$shl90|0;var $prev_foot=$add_ptr98;HEAP32[$prev_foot>>2]=$sub91;var $23=HEAP32[146736>>2];var $cmp99=($23|0)==0;if($cmp99){label=26;break}else{label=21;break};case 21:var $24=HEAP32[146748>>2];var $shr101=$23>>>3;var $shl102=$shr101<<1;var $arrayidx103=146768+($shl102<<2)|0;var $25=$arrayidx103;var $26=HEAP32[146728>>2];var $shl105=1<<$shr101;var $and106=$26&$shl105;var $tobool107=($and106|0)==0;if($tobool107){label=22;break}else{label=23;break};case 22:var $or110=$26|$shl105;HEAP32[146728>>2]=$or110;var $arrayidx103_sum_pre=$shl102+2|0;var $_pre=146768+($arrayidx103_sum_pre<<2)|0;var $F104_0=$25;var $_pre_phi=$_pre;label=25;break;case 23:var $arrayidx103_sum104=$shl102+2|0;var $27=146768+($arrayidx103_sum104<<2)|0;var $28=HEAP32[$27>>2];var $29=$28;var $30=HEAP32[146744>>2];var $cmp113=$29>>>0<$30>>>0;if($cmp113){label=24;break}else{var $F104_0=$28;var $_pre_phi=$27;label=25;break};case 24:_abort();case 25:var $_pre_phi;var $F104_0;HEAP32[$_pre_phi>>2]=$24;var $bk122=$F104_0+12|0;HEAP32[$bk122>>2]=$24;var $fd123=$24+8|0;HEAP32[$fd123>>2]=$F104_0;var $bk124=$24+12|0;HEAP32[$bk124>>2]=$25;label=26;break;case 26:HEAP32[146736>>2]=$sub91;HEAP32[146748>>2]=$21;var $31=$fd69;var $mem_0=$31;label=341;break;case 27:var $32=HEAP32[146732>>2];var $cmp128=($32|0)==0;if($cmp128){var $nb_0=$cond;label=160;break}else{label=28;break};case 28:var $sub_i=-$32|0;var $and_i=$32&$sub_i;var $sub2_i=$and_i-1|0;var $shr_i=$sub2_i>>>12;var $and3_i=$shr_i&16;var $shr4_i=$sub2_i>>>($and3_i>>>0);var $shr5_i=$shr4_i>>>5;var $and6_i=$shr5_i&8;var $add_i=$and6_i|$and3_i;var $shr7_i=$shr4_i>>>($and6_i>>>0);var $shr8_i=$shr7_i>>>2;var $and9_i=$shr8_i&4;var $add10_i=$add_i|$and9_i;var $shr11_i=$shr7_i>>>($and9_i>>>0);var $shr12_i=$shr11_i>>>1;var $and13_i=$shr12_i&2;var $add14_i=$add10_i|$and13_i;var $shr15_i=$shr11_i>>>($and13_i>>>0);var $shr16_i=$shr15_i>>>1;var $and17_i=$shr16_i&1;var $add18_i=$add14_i|$and17_i;var $shr19_i=$shr15_i>>>($and17_i>>>0);var $add20_i=$add18_i+$shr19_i|0;var $arrayidx_i=147032+($add20_i<<2)|0;var $33=HEAP32[$arrayidx_i>>2];var $head_i=$33+4|0;var $34=HEAP32[$head_i>>2];var $and21_i=$34&-8;var $sub22_i=$and21_i-$cond|0;var $t_0_i=$33;var $v_0_i=$33;var $rsize_0_i=$sub22_i;label=29;break;case 29:var $rsize_0_i;var $v_0_i;var $t_0_i;var $arrayidx23_i=$t_0_i+16|0;var $35=HEAP32[$arrayidx23_i>>2];var $cmp_i=($35|0)==0;if($cmp_i){label=30;break}else{var $cond7_i=$35;label=31;break};case 30:var $arrayidx27_i=$t_0_i+20|0;var $36=HEAP32[$arrayidx27_i>>2];var $cmp28_i=($36|0)==0;if($cmp28_i){label=32;break}else{var $cond7_i=$36;label=31;break};case 31:var $cond7_i;var $head29_i=$cond7_i+4|0;var $37=HEAP32[$head29_i>>2];var $and30_i=$37&-8;var $sub31_i=$and30_i-$cond|0;var $cmp32_i=$sub31_i>>>0<$rsize_0_i>>>0;var $sub31_rsize_0_i=$cmp32_i?$sub31_i:$rsize_0_i;var $cond_v_0_i=$cmp32_i?$cond7_i:$v_0_i;var $t_0_i=$cond7_i;var $v_0_i=$cond_v_0_i;var $rsize_0_i=$sub31_rsize_0_i;label=29;break;case 32:var $38=$v_0_i;var $39=HEAP32[146744>>2];var $cmp33_i=$38>>>0<$39>>>0;if($cmp33_i){label=76;break}else{label=33;break};case 33:var $add_ptr_i=$38+$cond|0;var $40=$add_ptr_i;var $cmp35_i=$38>>>0<$add_ptr_i>>>0;if($cmp35_i){label=34;break}else{label=76;break};case 34:var $parent_i=$v_0_i+24|0;var $41=HEAP32[$parent_i>>2];var $bk_i=$v_0_i+12|0;var $42=HEAP32[$bk_i>>2];var $cmp40_i=($42|0)==($v_0_i|0);if($cmp40_i){label=40;break}else{label=35;break};case 35:var $fd_i=$v_0_i+8|0;var $43=HEAP32[$fd_i>>2];var $44=$43;var $cmp45_i=$44>>>0<$39>>>0;if($cmp45_i){label=39;break}else{label=36;break};case 36:var $bk47_i=$43+12|0;var $45=HEAP32[$bk47_i>>2];var $cmp48_i=($45|0)==($v_0_i|0);if($cmp48_i){label=37;break}else{label=39;break};case 37:var $fd50_i=$42+8|0;var $46=HEAP32[$fd50_i>>2];var $cmp51_i=($46|0)==($v_0_i|0);if($cmp51_i){label=38;break}else{label=39;break};case 38:HEAP32[$bk47_i>>2]=$42;HEAP32[$fd50_i>>2]=$43;var $R_1_i=$42;label=47;break;case 39:_abort();case 40:var $arrayidx61_i=$v_0_i+20|0;var $47=HEAP32[$arrayidx61_i>>2];var $cmp62_i=($47|0)==0;if($cmp62_i){label=41;break}else{var $R_0_i=$47;var $RP_0_i=$arrayidx61_i;label=42;break};case 41:var $arrayidx65_i=$v_0_i+16|0;var $48=HEAP32[$arrayidx65_i>>2];var $cmp66_i=($48|0)==0;if($cmp66_i){var $R_1_i=0;label=47;break}else{var $R_0_i=$48;var $RP_0_i=$arrayidx65_i;label=42;break};case 42:var $RP_0_i;var $R_0_i;var $arrayidx71_i=$R_0_i+20|0;var $49=HEAP32[$arrayidx71_i>>2];var $cmp72_i=($49|0)==0;if($cmp72_i){label=43;break}else{var $R_0_i=$49;var $RP_0_i=$arrayidx71_i;label=42;break};case 43:var $arrayidx75_i=$R_0_i+16|0;var $50=HEAP32[$arrayidx75_i>>2];var $cmp76_i=($50|0)==0;if($cmp76_i){label=44;break}else{var $R_0_i=$50;var $RP_0_i=$arrayidx75_i;label=42;break};case 44:var $51=$RP_0_i;var $cmp81_i=$51>>>0<$39>>>0;if($cmp81_i){label=46;break}else{label=45;break};case 45:HEAP32[$RP_0_i>>2]=0;var $R_1_i=$R_0_i;label=47;break;case 46:_abort();case 47:var $R_1_i;var $cmp90_i=($41|0)==0;if($cmp90_i){label=67;break}else{label=48;break};case 48:var $index_i=$v_0_i+28|0;var $52=HEAP32[$index_i>>2];var $arrayidx94_i=147032+($52<<2)|0;var $53=HEAP32[$arrayidx94_i>>2];var $cmp95_i=($v_0_i|0)==($53|0);if($cmp95_i){label=49;break}else{label=51;break};case 49:HEAP32[$arrayidx94_i>>2]=$R_1_i;var $cond5_i=($R_1_i|0)==0;if($cond5_i){label=50;break}else{label=57;break};case 50:var $54=HEAP32[$index_i>>2];var $shl_i=1<<$54;var $neg_i=~$shl_i;var $55=HEAP32[146732>>2];var $and103_i=$55&$neg_i;HEAP32[146732>>2]=$and103_i;label=67;break;case 51:var $56=$41;var $57=HEAP32[146744>>2];var $cmp107_i=$56>>>0<$57>>>0;if($cmp107_i){label=55;break}else{label=52;break};case 52:var $arrayidx113_i=$41+16|0;var $58=HEAP32[$arrayidx113_i>>2];var $cmp114_i=($58|0)==($v_0_i|0);if($cmp114_i){label=53;break}else{label=54;break};case 53:HEAP32[$arrayidx113_i>>2]=$R_1_i;label=56;break;case 54:var $arrayidx121_i=$41+20|0;HEAP32[$arrayidx121_i>>2]=$R_1_i;label=56;break;case 55:_abort();case 56:var $cmp126_i=($R_1_i|0)==0;if($cmp126_i){label=67;break}else{label=57;break};case 57:var $59=$R_1_i;var $60=HEAP32[146744>>2];var $cmp130_i=$59>>>0<$60>>>0;if($cmp130_i){label=66;break}else{label=58;break};case 58:var $parent135_i=$R_1_i+24|0;HEAP32[$parent135_i>>2]=$41;var $arrayidx137_i=$v_0_i+16|0;var $61=HEAP32[$arrayidx137_i>>2];var $cmp138_i=($61|0)==0;if($cmp138_i){label=62;break}else{label=59;break};case 59:var $62=$61;var $63=HEAP32[146744>>2];var $cmp142_i=$62>>>0<$63>>>0;if($cmp142_i){label=61;break}else{label=60;break};case 60:var $arrayidx148_i=$R_1_i+16|0;HEAP32[$arrayidx148_i>>2]=$61;var $parent149_i=$61+24|0;HEAP32[$parent149_i>>2]=$R_1_i;label=62;break;case 61:_abort();case 62:var $arrayidx154_i=$v_0_i+20|0;var $64=HEAP32[$arrayidx154_i>>2];var $cmp155_i=($64|0)==0;if($cmp155_i){label=67;break}else{label=63;break};case 63:var $65=$64;var $66=HEAP32[146744>>2];var $cmp159_i=$65>>>0<$66>>>0;if($cmp159_i){label=65;break}else{label=64;break};case 64:var $arrayidx165_i=$R_1_i+20|0;HEAP32[$arrayidx165_i>>2]=$64;var $parent166_i=$64+24|0;HEAP32[$parent166_i>>2]=$R_1_i;label=67;break;case 65:_abort();case 66:_abort();case 67:var $cmp174_i=$rsize_0_i>>>0<16;if($cmp174_i){label=68;break}else{label=69;break};case 68:var $add177_i=$rsize_0_i+$cond|0;var $or178_i=$add177_i|3;var $head179_i=$v_0_i+4|0;HEAP32[$head179_i>>2]=$or178_i;var $add_ptr181_sum_i=$add177_i+4|0;var $head182_i=$38+$add_ptr181_sum_i|0;var $67=$head182_i;var $68=HEAP32[$67>>2];var $or183_i=$68|1;HEAP32[$67>>2]=$or183_i;label=77;break;case 69:var $or186_i=$cond|3;var $head187_i=$v_0_i+4|0;HEAP32[$head187_i>>2]=$or186_i;var $or188_i=$rsize_0_i|1;var $add_ptr_sum_i175=$cond|4;var $head189_i=$38+$add_ptr_sum_i175|0;var $69=$head189_i;HEAP32[$69>>2]=$or188_i;var $add_ptr_sum1_i=$rsize_0_i+$cond|0;var $add_ptr190_i=$38+$add_ptr_sum1_i|0;var $prev_foot_i=$add_ptr190_i;HEAP32[$prev_foot_i>>2]=$rsize_0_i;var $70=HEAP32[146736>>2];var $cmp191_i=($70|0)==0;if($cmp191_i){label=75;break}else{label=70;break};case 70:var $71=HEAP32[146748>>2];var $shr194_i=$70>>>3;var $shl195_i=$shr194_i<<1;var $arrayidx196_i=146768+($shl195_i<<2)|0;var $72=$arrayidx196_i;var $73=HEAP32[146728>>2];var $shl198_i=1<<$shr194_i;var $and199_i=$73&$shl198_i;var $tobool200_i=($and199_i|0)==0;if($tobool200_i){label=71;break}else{label=72;break};case 71:var $or204_i=$73|$shl198_i;HEAP32[146728>>2]=$or204_i;var $arrayidx196_sum_pre_i=$shl195_i+2|0;var $_pre_i=146768+($arrayidx196_sum_pre_i<<2)|0;var $F197_0_i=$72;var $_pre_phi_i=$_pre_i;label=74;break;case 72:var $arrayidx196_sum2_i=$shl195_i+2|0;var $74=146768+($arrayidx196_sum2_i<<2)|0;var $75=HEAP32[$74>>2];var $76=$75;var $77=HEAP32[146744>>2];var $cmp208_i=$76>>>0<$77>>>0;if($cmp208_i){label=73;break}else{var $F197_0_i=$75;var $_pre_phi_i=$74;label=74;break};case 73:_abort();case 74:var $_pre_phi_i;var $F197_0_i;HEAP32[$_pre_phi_i>>2]=$71;var $bk218_i=$F197_0_i+12|0;HEAP32[$bk218_i>>2]=$71;var $fd219_i=$71+8|0;HEAP32[$fd219_i>>2]=$F197_0_i;var $bk220_i=$71+12|0;HEAP32[$bk220_i>>2]=$72;label=75;break;case 75:HEAP32[146736>>2]=$rsize_0_i;HEAP32[146748>>2]=$40;label=77;break;case 76:_abort();case 77:var $add_ptr225_i=$v_0_i+8|0;var $78=$add_ptr225_i;var $cmp130=($add_ptr225_i|0)==0;if($cmp130){var $nb_0=$cond;label=160;break}else{var $mem_0=$78;label=341;break};case 78:var $cmp138=$bytes>>>0>4294967231;if($cmp138){var $nb_0=-1;label=160;break}else{label=79;break};case 79:var $add143=$bytes+11|0;var $and144=$add143&-8;var $79=HEAP32[146732>>2];var $cmp145=($79|0)==0;if($cmp145){var $nb_0=$and144;label=160;break}else{label=80;break};case 80:var $sub_i107=-$and144|0;var $shr_i108=$add143>>>8;var $cmp_i109=($shr_i108|0)==0;if($cmp_i109){var $idx_0_i=0;label=83;break}else{label=81;break};case 81:var $cmp1_i=$and144>>>0>16777215;if($cmp1_i){var $idx_0_i=31;label=83;break}else{label=82;break};case 82:var $sub4_i=$shr_i108+1048320|0;var $shr5_i111=$sub4_i>>>16;var $and_i112=$shr5_i111&8;var $shl_i113=$shr_i108<<$and_i112;var $sub6_i=$shl_i113+520192|0;var $shr7_i114=$sub6_i>>>16;var $and8_i=$shr7_i114&4;var $add_i115=$and8_i|$and_i112;var $shl9_i=$shl_i113<<$and8_i;var $sub10_i=$shl9_i+245760|0;var $shr11_i116=$sub10_i>>>16;var $and12_i=$shr11_i116&2;var $add13_i=$add_i115|$and12_i;var $sub14_i=14-$add13_i|0;var $shl15_i=$shl9_i<<$and12_i;var $shr16_i117=$shl15_i>>>15;var $add17_i=$sub14_i+$shr16_i117|0;var $shl18_i=$add17_i<<1;var $add19_i=$add17_i+7|0;var $shr20_i=$and144>>>($add19_i>>>0);var $and21_i118=$shr20_i&1;var $add22_i=$and21_i118|$shl18_i;var $idx_0_i=$add22_i;label=83;break;case 83:var $idx_0_i;var $arrayidx_i119=147032+($idx_0_i<<2)|0;var $80=HEAP32[$arrayidx_i119>>2];var $cmp24_i=($80|0)==0;if($cmp24_i){var $v_2_i=0;var $rsize_2_i=$sub_i107;var $t_1_i=0;label=90;break}else{label=84;break};case 84:var $cmp26_i=($idx_0_i|0)==31;if($cmp26_i){var $cond_i=0;label=86;break}else{label=85;break};case 85:var $shr27_i=$idx_0_i>>>1;var $sub30_i=25-$shr27_i|0;var $cond_i=$sub30_i;label=86;break;case 86:var $cond_i;var $shl31_i=$and144<<$cond_i;var $v_0_i123=0;var $rsize_0_i122=$sub_i107;var $t_0_i121=$80;var $sizebits_0_i=$shl31_i;var $rst_0_i=0;label=87;break;case 87:var $rst_0_i;var $sizebits_0_i;var $t_0_i121;var $rsize_0_i122;var $v_0_i123;var $head_i124=$t_0_i121+4|0;var $81=HEAP32[$head_i124>>2];var $and32_i=$81&-8;var $sub33_i=$and32_i-$and144|0;var $cmp34_i=$sub33_i>>>0<$rsize_0_i122>>>0;if($cmp34_i){label=88;break}else{var $v_1_i=$v_0_i123;var $rsize_1_i=$rsize_0_i122;label=89;break};case 88:var $cmp36_i=($and32_i|0)==($and144|0);if($cmp36_i){var $v_2_i=$t_0_i121;var $rsize_2_i=$sub33_i;var $t_1_i=$t_0_i121;label=90;break}else{var $v_1_i=$t_0_i121;var $rsize_1_i=$sub33_i;label=89;break};case 89:var $rsize_1_i;var $v_1_i;var $arrayidx40_i=$t_0_i121+20|0;var $82=HEAP32[$arrayidx40_i>>2];var $shr41_i=$sizebits_0_i>>>31;var $arrayidx44_i=$t_0_i121+16+($shr41_i<<2)|0;var $83=HEAP32[$arrayidx44_i>>2];var $cmp45_i125=($82|0)==0;var $cmp46_i=($82|0)==($83|0);var $or_cond_i=$cmp45_i125|$cmp46_i;var $rst_1_i=$or_cond_i?$rst_0_i:$82;var $cmp49_i=($83|0)==0;var $shl52_i=$sizebits_0_i<<1;if($cmp49_i){var $v_2_i=$v_1_i;var $rsize_2_i=$rsize_1_i;var $t_1_i=$rst_1_i;label=90;break}else{var $v_0_i123=$v_1_i;var $rsize_0_i122=$rsize_1_i;var $t_0_i121=$83;var $sizebits_0_i=$shl52_i;var $rst_0_i=$rst_1_i;label=87;break};case 90:var $t_1_i;var $rsize_2_i;var $v_2_i;var $cmp54_i=($t_1_i|0)==0;var $cmp56_i=($v_2_i|0)==0;var $or_cond18_i=$cmp54_i&$cmp56_i;if($or_cond18_i){label=91;break}else{var $t_2_ph_i=$t_1_i;label=93;break};case 91:var $shl59_i=2<<$idx_0_i;var $sub62_i=-$shl59_i|0;var $or_i=$shl59_i|$sub62_i;var $and63_i=$79&$or_i;var $cmp64_i=($and63_i|0)==0;if($cmp64_i){var $nb_0=$and144;label=160;break}else{label=92;break};case 92:var $sub66_i=-$and63_i|0;var $and67_i=$and63_i&$sub66_i;var $sub69_i=$and67_i-1|0;var $shr71_i=$sub69_i>>>12;var $and72_i=$shr71_i&16;var $shr74_i=$sub69_i>>>($and72_i>>>0);var $shr75_i=$shr74_i>>>5;var $and76_i=$shr75_i&8;var $add77_i=$and76_i|$and72_i;var $shr78_i=$shr74_i>>>($and76_i>>>0);var $shr79_i=$shr78_i>>>2;var $and80_i=$shr79_i&4;var $add81_i=$add77_i|$and80_i;var $shr82_i=$shr78_i>>>($and80_i>>>0);var $shr83_i=$shr82_i>>>1;var $and84_i=$shr83_i&2;var $add85_i=$add81_i|$and84_i;var $shr86_i=$shr82_i>>>($and84_i>>>0);var $shr87_i=$shr86_i>>>1;var $and88_i=$shr87_i&1;var $add89_i=$add85_i|$and88_i;var $shr90_i=$shr86_i>>>($and88_i>>>0);var $add91_i=$add89_i+$shr90_i|0;var $arrayidx93_i=147032+($add91_i<<2)|0;var $84=HEAP32[$arrayidx93_i>>2];var $t_2_ph_i=$84;label=93;break;case 93:var $t_2_ph_i;var $cmp9623_i=($t_2_ph_i|0)==0;if($cmp9623_i){var $rsize_3_lcssa_i=$rsize_2_i;var $v_3_lcssa_i=$v_2_i;label=96;break}else{var $t_224_i=$t_2_ph_i;var $rsize_325_i=$rsize_2_i;var $v_326_i=$v_2_i;label=94;break};case 94:var $v_326_i;var $rsize_325_i;var $t_224_i;var $head98_i=$t_224_i+4|0;var $85=HEAP32[$head98_i>>2];var $and99_i=$85&-8;var $sub100_i=$and99_i-$and144|0;var $cmp101_i=$sub100_i>>>0<$rsize_325_i>>>0;var $sub100_rsize_3_i=$cmp101_i?$sub100_i:$rsize_325_i;var $t_2_v_3_i=$cmp101_i?$t_224_i:$v_326_i;var $arrayidx105_i=$t_224_i+16|0;var $86=HEAP32[$arrayidx105_i>>2];var $cmp106_i=($86|0)==0;if($cmp106_i){label=95;break}else{var $t_224_i=$86;var $rsize_325_i=$sub100_rsize_3_i;var $v_326_i=$t_2_v_3_i;label=94;break};case 95:var $arrayidx112_i=$t_224_i+20|0;var $87=HEAP32[$arrayidx112_i>>2];var $cmp96_i=($87|0)==0;if($cmp96_i){var $rsize_3_lcssa_i=$sub100_rsize_3_i;var $v_3_lcssa_i=$t_2_v_3_i;label=96;break}else{var $t_224_i=$87;var $rsize_325_i=$sub100_rsize_3_i;var $v_326_i=$t_2_v_3_i;label=94;break};case 96:var $v_3_lcssa_i;var $rsize_3_lcssa_i;var $cmp115_i=($v_3_lcssa_i|0)==0;if($cmp115_i){var $nb_0=$and144;label=160;break}else{label=97;break};case 97:var $88=HEAP32[146736>>2];var $sub117_i=$88-$and144|0;var $cmp118_i=$rsize_3_lcssa_i>>>0<$sub117_i>>>0;if($cmp118_i){label=98;break}else{var $nb_0=$and144;label=160;break};case 98:var $89=$v_3_lcssa_i;var $90=HEAP32[146744>>2];var $cmp120_i=$89>>>0<$90>>>0;if($cmp120_i){label=158;break}else{label=99;break};case 99:var $add_ptr_i128=$89+$and144|0;var $91=$add_ptr_i128;var $cmp122_i=$89>>>0<$add_ptr_i128>>>0;if($cmp122_i){label=100;break}else{label=158;break};case 100:var $parent_i129=$v_3_lcssa_i+24|0;var $92=HEAP32[$parent_i129>>2];var $bk_i130=$v_3_lcssa_i+12|0;var $93=HEAP32[$bk_i130>>2];var $cmp127_i=($93|0)==($v_3_lcssa_i|0);if($cmp127_i){label=106;break}else{label=101;break};case 101:var $fd_i131=$v_3_lcssa_i+8|0;var $94=HEAP32[$fd_i131>>2];var $95=$94;var $cmp132_i=$95>>>0<$90>>>0;if($cmp132_i){label=105;break}else{label=102;break};case 102:var $bk135_i=$94+12|0;var $96=HEAP32[$bk135_i>>2];var $cmp136_i=($96|0)==($v_3_lcssa_i|0);if($cmp136_i){label=103;break}else{label=105;break};case 103:var $fd138_i=$93+8|0;var $97=HEAP32[$fd138_i>>2];var $cmp139_i=($97|0)==($v_3_lcssa_i|0);if($cmp139_i){label=104;break}else{label=105;break};case 104:HEAP32[$bk135_i>>2]=$93;HEAP32[$fd138_i>>2]=$94;var $R_1_i139=$93;label=113;break;case 105:_abort();case 106:var $arrayidx150_i=$v_3_lcssa_i+20|0;var $98=HEAP32[$arrayidx150_i>>2];var $cmp151_i=($98|0)==0;if($cmp151_i){label=107;break}else{var $R_0_i137=$98;var $RP_0_i136=$arrayidx150_i;label=108;break};case 107:var $arrayidx154_i133=$v_3_lcssa_i+16|0;var $99=HEAP32[$arrayidx154_i133>>2];var $cmp155_i134=($99|0)==0;if($cmp155_i134){var $R_1_i139=0;label=113;break}else{var $R_0_i137=$99;var $RP_0_i136=$arrayidx154_i133;label=108;break};case 108:var $RP_0_i136;var $R_0_i137;var $arrayidx160_i=$R_0_i137+20|0;var $100=HEAP32[$arrayidx160_i>>2];var $cmp161_i=($100|0)==0;if($cmp161_i){label=109;break}else{var $R_0_i137=$100;var $RP_0_i136=$arrayidx160_i;label=108;break};case 109:var $arrayidx164_i=$R_0_i137+16|0;var $101=HEAP32[$arrayidx164_i>>2];var $cmp165_i=($101|0)==0;if($cmp165_i){label=110;break}else{var $R_0_i137=$101;var $RP_0_i136=$arrayidx164_i;label=108;break};case 110:var $102=$RP_0_i136;var $cmp170_i=$102>>>0<$90>>>0;if($cmp170_i){label=112;break}else{label=111;break};case 111:HEAP32[$RP_0_i136>>2]=0;var $R_1_i139=$R_0_i137;label=113;break;case 112:_abort();case 113:var $R_1_i139;var $cmp179_i=($92|0)==0;if($cmp179_i){label=133;break}else{label=114;break};case 114:var $index_i140=$v_3_lcssa_i+28|0;var $103=HEAP32[$index_i140>>2];var $arrayidx183_i=147032+($103<<2)|0;var $104=HEAP32[$arrayidx183_i>>2];var $cmp184_i=($v_3_lcssa_i|0)==($104|0);if($cmp184_i){label=115;break}else{label=117;break};case 115:HEAP32[$arrayidx183_i>>2]=$R_1_i139;var $cond20_i=($R_1_i139|0)==0;if($cond20_i){label=116;break}else{label=123;break};case 116:var $105=HEAP32[$index_i140>>2];var $shl191_i=1<<$105;var $neg_i141=~$shl191_i;var $106=HEAP32[146732>>2];var $and193_i=$106&$neg_i141;HEAP32[146732>>2]=$and193_i;label=133;break;case 117:var $107=$92;var $108=HEAP32[146744>>2];var $cmp197_i=$107>>>0<$108>>>0;if($cmp197_i){label=121;break}else{label=118;break};case 118:var $arrayidx203_i=$92+16|0;var $109=HEAP32[$arrayidx203_i>>2];var $cmp204_i=($109|0)==($v_3_lcssa_i|0);if($cmp204_i){label=119;break}else{label=120;break};case 119:HEAP32[$arrayidx203_i>>2]=$R_1_i139;label=122;break;case 120:var $arrayidx211_i=$92+20|0;HEAP32[$arrayidx211_i>>2]=$R_1_i139;label=122;break;case 121:_abort();case 122:var $cmp216_i=($R_1_i139|0)==0;if($cmp216_i){label=133;break}else{label=123;break};case 123:var $110=$R_1_i139;var $111=HEAP32[146744>>2];var $cmp220_i=$110>>>0<$111>>>0;if($cmp220_i){label=132;break}else{label=124;break};case 124:var $parent225_i=$R_1_i139+24|0;HEAP32[$parent225_i>>2]=$92;var $arrayidx227_i=$v_3_lcssa_i+16|0;var $112=HEAP32[$arrayidx227_i>>2];var $cmp228_i=($112|0)==0;if($cmp228_i){label=128;break}else{label=125;break};case 125:var $113=$112;var $114=HEAP32[146744>>2];var $cmp232_i=$113>>>0<$114>>>0;if($cmp232_i){label=127;break}else{label=126;break};case 126:var $arrayidx238_i=$R_1_i139+16|0;HEAP32[$arrayidx238_i>>2]=$112;var $parent239_i=$112+24|0;HEAP32[$parent239_i>>2]=$R_1_i139;label=128;break;case 127:_abort();case 128:var $arrayidx244_i=$v_3_lcssa_i+20|0;var $115=HEAP32[$arrayidx244_i>>2];var $cmp245_i=($115|0)==0;if($cmp245_i){label=133;break}else{label=129;break};case 129:var $116=$115;var $117=HEAP32[146744>>2];var $cmp249_i=$116>>>0<$117>>>0;if($cmp249_i){label=131;break}else{label=130;break};case 130:var $arrayidx255_i=$R_1_i139+20|0;HEAP32[$arrayidx255_i>>2]=$115;var $parent256_i=$115+24|0;HEAP32[$parent256_i>>2]=$R_1_i139;label=133;break;case 131:_abort();case 132:_abort();case 133:var $cmp264_i=$rsize_3_lcssa_i>>>0<16;if($cmp264_i){label=134;break}else{label=135;break};case 134:var $add267_i=$rsize_3_lcssa_i+$and144|0;var $or269_i=$add267_i|3;var $head270_i=$v_3_lcssa_i+4|0;HEAP32[$head270_i>>2]=$or269_i;var $add_ptr272_sum_i=$add267_i+4|0;var $head273_i=$89+$add_ptr272_sum_i|0;var $118=$head273_i;var $119=HEAP32[$118>>2];var $or274_i=$119|1;HEAP32[$118>>2]=$or274_i;label=159;break;case 135:var $or277_i=$and144|3;var $head278_i=$v_3_lcssa_i+4|0;HEAP32[$head278_i>>2]=$or277_i;var $or279_i=$rsize_3_lcssa_i|1;var $add_ptr_sum_i143174=$and144|4;var $head280_i=$89+$add_ptr_sum_i143174|0;var $120=$head280_i;HEAP32[$120>>2]=$or279_i;var $add_ptr_sum1_i144=$rsize_3_lcssa_i+$and144|0;var $add_ptr281_i=$89+$add_ptr_sum1_i144|0;var $prev_foot_i145=$add_ptr281_i;HEAP32[$prev_foot_i145>>2]=$rsize_3_lcssa_i;var $shr282_i=$rsize_3_lcssa_i>>>3;var $cmp283_i=$rsize_3_lcssa_i>>>0<256;if($cmp283_i){label=136;break}else{label=141;break};case 136:var $shl287_i=$shr282_i<<1;var $arrayidx288_i=146768+($shl287_i<<2)|0;var $121=$arrayidx288_i;var $122=HEAP32[146728>>2];var $shl290_i=1<<$shr282_i;var $and291_i=$122&$shl290_i;var $tobool292_i=($and291_i|0)==0;if($tobool292_i){label=137;break}else{label=138;break};case 137:var $or296_i=$122|$shl290_i;HEAP32[146728>>2]=$or296_i;var $arrayidx288_sum_pre_i=$shl287_i+2|0;var $_pre_i146=146768+($arrayidx288_sum_pre_i<<2)|0;var $F289_0_i=$121;var $_pre_phi_i147=$_pre_i146;label=140;break;case 138:var $arrayidx288_sum16_i=$shl287_i+2|0;var $123=146768+($arrayidx288_sum16_i<<2)|0;var $124=HEAP32[$123>>2];var $125=$124;var $126=HEAP32[146744>>2];var $cmp300_i=$125>>>0<$126>>>0;if($cmp300_i){label=139;break}else{var $F289_0_i=$124;var $_pre_phi_i147=$123;label=140;break};case 139:_abort();case 140:var $_pre_phi_i147;var $F289_0_i;HEAP32[$_pre_phi_i147>>2]=$91;var $bk310_i=$F289_0_i+12|0;HEAP32[$bk310_i>>2]=$91;var $add_ptr_sum14_i=$and144+8|0;var $fd311_i=$89+$add_ptr_sum14_i|0;var $127=$fd311_i;HEAP32[$127>>2]=$F289_0_i;var $add_ptr_sum15_i=$and144+12|0;var $bk312_i=$89+$add_ptr_sum15_i|0;var $128=$bk312_i;HEAP32[$128>>2]=$121;label=159;break;case 141:var $129=$add_ptr_i128;var $shr317_i=$rsize_3_lcssa_i>>>8;var $cmp318_i=($shr317_i|0)==0;if($cmp318_i){var $I315_0_i=0;label=144;break}else{label=142;break};case 142:var $cmp322_i=$rsize_3_lcssa_i>>>0>16777215;if($cmp322_i){var $I315_0_i=31;label=144;break}else{label=143;break};case 143:var $sub328_i=$shr317_i+1048320|0;var $shr329_i=$sub328_i>>>16;var $and330_i=$shr329_i&8;var $shl332_i=$shr317_i<<$and330_i;var $sub333_i=$shl332_i+520192|0;var $shr334_i=$sub333_i>>>16;var $and335_i=$shr334_i&4;var $add336_i=$and335_i|$and330_i;var $shl337_i=$shl332_i<<$and335_i;var $sub338_i=$shl337_i+245760|0;var $shr339_i=$sub338_i>>>16;var $and340_i=$shr339_i&2;var $add341_i=$add336_i|$and340_i;var $sub342_i=14-$add341_i|0;var $shl343_i=$shl337_i<<$and340_i;var $shr344_i=$shl343_i>>>15;var $add345_i=$sub342_i+$shr344_i|0;var $shl346_i=$add345_i<<1;var $add347_i=$add345_i+7|0;var $shr348_i=$rsize_3_lcssa_i>>>($add347_i>>>0);var $and349_i=$shr348_i&1;var $add350_i=$and349_i|$shl346_i;var $I315_0_i=$add350_i;label=144;break;case 144:var $I315_0_i;var $arrayidx354_i=147032+($I315_0_i<<2)|0;var $add_ptr_sum2_i=$and144+28|0;var $index355_i=$89+$add_ptr_sum2_i|0;var $130=$index355_i;HEAP32[$130>>2]=$I315_0_i;var $add_ptr_sum3_i=$and144+16|0;var $child356_i=$89+$add_ptr_sum3_i|0;var $child356_sum_i=$and144+20|0;var $arrayidx357_i=$89+$child356_sum_i|0;var $131=$arrayidx357_i;HEAP32[$131>>2]=0;var $arrayidx359_i=$child356_i;HEAP32[$arrayidx359_i>>2]=0;var $132=HEAP32[146732>>2];var $shl361_i=1<<$I315_0_i;var $and362_i=$132&$shl361_i;var $tobool363_i=($and362_i|0)==0;if($tobool363_i){label=145;break}else{label=146;break};case 145:var $or367_i=$132|$shl361_i;HEAP32[146732>>2]=$or367_i;HEAP32[$arrayidx354_i>>2]=$129;var $133=$arrayidx354_i;var $add_ptr_sum4_i=$and144+24|0;var $parent368_i=$89+$add_ptr_sum4_i|0;var $134=$parent368_i;HEAP32[$134>>2]=$133;var $add_ptr_sum5_i=$and144+12|0;var $bk369_i=$89+$add_ptr_sum5_i|0;var $135=$bk369_i;HEAP32[$135>>2]=$129;var $add_ptr_sum6_i=$and144+8|0;var $fd370_i=$89+$add_ptr_sum6_i|0;var $136=$fd370_i;HEAP32[$136>>2]=$129;label=159;break;case 146:var $137=HEAP32[$arrayidx354_i>>2];var $cmp373_i=($I315_0_i|0)==31;if($cmp373_i){var $cond382_i=0;label=148;break}else{label=147;break};case 147:var $shr377_i=$I315_0_i>>>1;var $sub380_i=25-$shr377_i|0;var $cond382_i=$sub380_i;label=148;break;case 148:var $cond382_i;var $shl383_i=$rsize_3_lcssa_i<<$cond382_i;var $K372_0_i=$shl383_i;var $T_0_i=$137;label=149;break;case 149:var $T_0_i;var $K372_0_i;var $head385_i=$T_0_i+4|0;var $138=HEAP32[$head385_i>>2];var $and386_i=$138&-8;var $cmp387_i=($and386_i|0)==($rsize_3_lcssa_i|0);if($cmp387_i){label=154;break}else{label=150;break};case 150:var $shr390_i=$K372_0_i>>>31;var $arrayidx393_i=$T_0_i+16+($shr390_i<<2)|0;var $139=HEAP32[$arrayidx393_i>>2];var $cmp395_i=($139|0)==0;var $shl394_i=$K372_0_i<<1;if($cmp395_i){label=151;break}else{var $K372_0_i=$shl394_i;var $T_0_i=$139;label=149;break};case 151:var $140=$arrayidx393_i;var $141=HEAP32[146744>>2];var $cmp400_i=$140>>>0<$141>>>0;if($cmp400_i){label=153;break}else{label=152;break};case 152:HEAP32[$arrayidx393_i>>2]=$129;var $add_ptr_sum11_i=$and144+24|0;var $parent405_i=$89+$add_ptr_sum11_i|0;var $142=$parent405_i;HEAP32[$142>>2]=$T_0_i;var $add_ptr_sum12_i=$and144+12|0;var $bk406_i=$89+$add_ptr_sum12_i|0;var $143=$bk406_i;HEAP32[$143>>2]=$129;var $add_ptr_sum13_i=$and144+8|0;var $fd407_i=$89+$add_ptr_sum13_i|0;var $144=$fd407_i;HEAP32[$144>>2]=$129;label=159;break;case 153:_abort();case 154:var $fd412_i=$T_0_i+8|0;var $145=HEAP32[$fd412_i>>2];var $146=$T_0_i;var $147=HEAP32[146744>>2];var $cmp414_i=$146>>>0<$147>>>0;if($cmp414_i){label=157;break}else{label=155;break};case 155:var $148=$145;var $cmp418_i=$148>>>0<$147>>>0;if($cmp418_i){label=157;break}else{label=156;break};case 156:var $bk425_i=$145+12|0;HEAP32[$bk425_i>>2]=$129;HEAP32[$fd412_i>>2]=$129;var $add_ptr_sum8_i=$and144+8|0;var $fd427_i=$89+$add_ptr_sum8_i|0;var $149=$fd427_i;HEAP32[$149>>2]=$145;var $add_ptr_sum9_i=$and144+12|0;var $bk428_i=$89+$add_ptr_sum9_i|0;var $150=$bk428_i;HEAP32[$150>>2]=$T_0_i;var $add_ptr_sum10_i=$and144+24|0;var $parent429_i=$89+$add_ptr_sum10_i|0;var $151=$parent429_i;HEAP32[$151>>2]=0;label=159;break;case 157:_abort();case 158:_abort();case 159:var $add_ptr436_i=$v_3_lcssa_i+8|0;var $152=$add_ptr436_i;var $cmp149=($add_ptr436_i|0)==0;if($cmp149){var $nb_0=$and144;label=160;break}else{var $mem_0=$152;label=341;break};case 160:var $nb_0;var $153=HEAP32[146736>>2];var $cmp155=$nb_0>>>0>$153>>>0;if($cmp155){label=165;break}else{label=161;break};case 161:var $sub159=$153-$nb_0|0;var $154=HEAP32[146748>>2];var $cmp161=$sub159>>>0>15;if($cmp161){label=162;break}else{label=163;break};case 162:var $155=$154;var $add_ptr165=$155+$nb_0|0;var $156=$add_ptr165;HEAP32[146748>>2]=$156;HEAP32[146736>>2]=$sub159;var $or166=$sub159|1;var $add_ptr165_sum=$nb_0+4|0;var $head167=$155+$add_ptr165_sum|0;var $157=$head167;HEAP32[$157>>2]=$or166;var $add_ptr168=$155+$153|0;var $prev_foot169=$add_ptr168;HEAP32[$prev_foot169>>2]=$sub159;var $or171=$nb_0|3;var $head172=$154+4|0;HEAP32[$head172>>2]=$or171;label=164;break;case 163:HEAP32[146736>>2]=0;HEAP32[146748>>2]=0;var $or175=$153|3;var $head176=$154+4|0;HEAP32[$head176>>2]=$or175;var $158=$154;var $add_ptr177_sum=$153+4|0;var $head178=$158+$add_ptr177_sum|0;var $159=$head178;var $160=HEAP32[$159>>2];var $or179=$160|1;HEAP32[$159>>2]=$or179;label=164;break;case 164:var $add_ptr181=$154+8|0;var $161=$add_ptr181;var $mem_0=$161;label=341;break;case 165:var $162=HEAP32[146740>>2];var $cmp183=$nb_0>>>0<$162>>>0;if($cmp183){label=166;break}else{label=167;break};case 166:var $sub187=$162-$nb_0|0;HEAP32[146740>>2]=$sub187;var $163=HEAP32[146752>>2];var $164=$163;var $add_ptr190=$164+$nb_0|0;var $165=$add_ptr190;HEAP32[146752>>2]=$165;var $or191=$sub187|1;var $add_ptr190_sum=$nb_0+4|0;var $head192=$164+$add_ptr190_sum|0;var $166=$head192;HEAP32[$166>>2]=$or191;var $or194=$nb_0|3;var $head195=$163+4|0;HEAP32[$head195>>2]=$or194;var $add_ptr196=$163+8|0;var $167=$add_ptr196;var $mem_0=$167;label=341;break;case 167:var $168=HEAP32[63152>>2];var $cmp_i148=($168|0)==0;if($cmp_i148){label=168;break}else{label=171;break};case 168:var $call_i_i=_sysconf(30);var $sub_i_i=$call_i_i-1|0;var $and_i_i=$sub_i_i&$call_i_i;var $cmp1_i_i=($and_i_i|0)==0;if($cmp1_i_i){label=170;break}else{label=169;break};case 169:_abort();case 170:HEAP32[63160>>2]=$call_i_i;HEAP32[63156>>2]=$call_i_i;HEAP32[63164>>2]=-1;HEAP32[63168>>2]=-1;HEAP32[63172>>2]=0;HEAP32[147172>>2]=0;var $call6_i_i=_time(0);var $xor_i_i=$call6_i_i&-16;var $and7_i_i=$xor_i_i^1431655768;HEAP32[63152>>2]=$and7_i_i;label=171;break;case 171:var $add_i149=$nb_0+48|0;var $169=HEAP32[63160>>2];var $sub_i150=$nb_0+47|0;var $add9_i=$169+$sub_i150|0;var $neg_i151=-$169|0;var $and11_i=$add9_i&$neg_i151;var $cmp12_i=$and11_i>>>0>$nb_0>>>0;if($cmp12_i){label=172;break}else{var $mem_0=0;label=341;break};case 172:var $170=HEAP32[147168>>2];var $cmp15_i=($170|0)==0;if($cmp15_i){label=174;break}else{label=173;break};case 173:var $171=HEAP32[147160>>2];var $add17_i152=$171+$and11_i|0;var $cmp19_i=$add17_i152>>>0<=$171>>>0;var $cmp21_i=$add17_i152>>>0>$170>>>0;var $or_cond1_i=$cmp19_i|$cmp21_i;if($or_cond1_i){var $mem_0=0;label=341;break}else{label=174;break};case 174:var $172=HEAP32[147172>>2];var $and26_i=$172&4;var $tobool27_i=($and26_i|0)==0;if($tobool27_i){label=175;break}else{var $tsize_1_i=0;label=198;break};case 175:var $173=HEAP32[146752>>2];var $cmp29_i=($173|0)==0;if($cmp29_i){label=181;break}else{label=176;break};case 176:var $174=$173;var $sp_0_i_i=147176;label=177;break;case 177:var $sp_0_i_i;var $base_i_i=$sp_0_i_i|0;var $175=HEAP32[$base_i_i>>2];var $cmp_i9_i=$175>>>0>$174>>>0;if($cmp_i9_i){label=179;break}else{label=178;break};case 178:var $size_i_i=$sp_0_i_i+4|0;var $176=HEAP32[$size_i_i>>2];var $add_ptr_i_i=$175+$176|0;var $cmp2_i_i=$add_ptr_i_i>>>0>$174>>>0;if($cmp2_i_i){label=180;break}else{label=179;break};case 179:var $next_i_i=$sp_0_i_i+8|0;var $177=HEAP32[$next_i_i>>2];var $cmp3_i_i=($177|0)==0;if($cmp3_i_i){label=181;break}else{var $sp_0_i_i=$177;label=177;break};case 180:var $cmp32_i154=($sp_0_i_i|0)==0;if($cmp32_i154){label=181;break}else{label=188;break};case 181:var $call34_i=_sbrk(0);var $cmp35_i156=($call34_i|0)==-1;if($cmp35_i156){var $tsize_0758385_i=0;label=197;break}else{label=182;break};case 182:var $178=$call34_i;var $179=HEAP32[63156>>2];var $sub38_i=$179-1|0;var $and39_i=$sub38_i&$178;var $cmp40_i157=($and39_i|0)==0;if($cmp40_i157){var $ssize_0_i=$and11_i;label=184;break}else{label=183;break};case 183:var $add43_i=$sub38_i+$178|0;var $neg45_i=-$179|0;var $and46_i=$add43_i&$neg45_i;var $sub47_i=$and11_i-$178|0;var $add48_i=$sub47_i+$and46_i|0;var $ssize_0_i=$add48_i;label=184;break;case 184:var $ssize_0_i;var $180=HEAP32[147160>>2];var $add51_i=$180+$ssize_0_i|0;var $cmp52_i=$ssize_0_i>>>0>$nb_0>>>0;var $cmp54_i158=$ssize_0_i>>>0<2147483647;var $or_cond_i159=$cmp52_i&$cmp54_i158;if($or_cond_i159){label=185;break}else{var $tsize_0758385_i=0;label=197;break};case 185:var $181=HEAP32[147168>>2];var $cmp57_i=($181|0)==0;if($cmp57_i){label=187;break}else{label=186;break};case 186:var $cmp60_i=$add51_i>>>0<=$180>>>0;var $cmp63_i=$add51_i>>>0>$181>>>0;var $or_cond2_i=$cmp60_i|$cmp63_i;if($or_cond2_i){var $tsize_0758385_i=0;label=197;break}else{label=187;break};case 187:var $call65_i=_sbrk($ssize_0_i);var $cmp66_i160=($call65_i|0)==($call34_i|0);var $ssize_0__i=$cmp66_i160?$ssize_0_i:0;var $call34__i=$cmp66_i160?$call34_i:-1;var $tbase_0_i=$call34__i;var $tsize_0_i=$ssize_0__i;var $br_0_i=$call65_i;var $ssize_1_i=$ssize_0_i;label=190;break;case 188:var $182=HEAP32[146740>>2];var $add74_i=$add9_i-$182|0;var $and77_i=$add74_i&$neg_i151;var $cmp78_i=$and77_i>>>0<2147483647;if($cmp78_i){label=189;break}else{var $tsize_0758385_i=0;label=197;break};case 189:var $call80_i=_sbrk($and77_i);var $183=HEAP32[$base_i_i>>2];var $184=HEAP32[$size_i_i>>2];var $add_ptr_i162=$183+$184|0;var $cmp82_i=($call80_i|0)==($add_ptr_i162|0);var $and77__i=$cmp82_i?$and77_i:0;var $call80__i=$cmp82_i?$call80_i:-1;var $tbase_0_i=$call80__i;var $tsize_0_i=$and77__i;var $br_0_i=$call80_i;var $ssize_1_i=$and77_i;label=190;break;case 190:var $ssize_1_i;var $br_0_i;var $tsize_0_i;var $tbase_0_i;var $sub109_i=-$ssize_1_i|0;var $cmp86_i=($tbase_0_i|0)==-1;if($cmp86_i){label=191;break}else{var $tsize_291_i=$tsize_0_i;var $tbase_292_i=$tbase_0_i;label=201;break};case 191:var $cmp88_i=($br_0_i|0)!=-1;var $cmp90_i163=$ssize_1_i>>>0<2147483647;var $or_cond3_i=$cmp88_i&$cmp90_i163;var $cmp93_i=$ssize_1_i>>>0<$add_i149>>>0;var $or_cond4_i=$or_cond3_i&$cmp93_i;if($or_cond4_i){label=192;break}else{var $ssize_2_i=$ssize_1_i;label=196;break};case 192:var $185=HEAP32[63160>>2];var $sub96_i=$sub_i150-$ssize_1_i|0;var $add98_i=$sub96_i+$185|0;var $neg100_i=-$185|0;var $and101_i=$add98_i&$neg100_i;var $cmp102_i=$and101_i>>>0<2147483647;if($cmp102_i){label=193;break}else{var $ssize_2_i=$ssize_1_i;label=196;break};case 193:var $call104_i=_sbrk($and101_i);var $cmp105_i=($call104_i|0)==-1;if($cmp105_i){label=195;break}else{label=194;break};case 194:var $add107_i=$and101_i+$ssize_1_i|0;var $ssize_2_i=$add107_i;label=196;break;case 195:var $call110_i=_sbrk($sub109_i);var $tsize_0758385_i=$tsize_0_i;label=197;break;case 196:var $ssize_2_i;var $cmp115_i164=($br_0_i|0)==-1;if($cmp115_i164){var $tsize_0758385_i=$tsize_0_i;label=197;break}else{var $tsize_291_i=$ssize_2_i;var $tbase_292_i=$br_0_i;label=201;break};case 197:var $tsize_0758385_i;var $186=HEAP32[147172>>2];var $or_i165=$186|4;HEAP32[147172>>2]=$or_i165;var $tsize_1_i=$tsize_0758385_i;label=198;break;case 198:var $tsize_1_i;var $cmp124_i=$and11_i>>>0<2147483647;if($cmp124_i){label=199;break}else{label=340;break};case 199:var $call128_i=_sbrk($and11_i);var $call129_i=_sbrk(0);var $notlhs_i=($call128_i|0)!=-1;var $notrhs_i=($call129_i|0)!=-1;var $or_cond6_not_i=$notrhs_i&$notlhs_i;var $cmp134_i=$call128_i>>>0<$call129_i>>>0;var $or_cond7_i=$or_cond6_not_i&$cmp134_i;if($or_cond7_i){label=200;break}else{label=340;break};case 200:var $sub_ptr_lhs_cast_i=$call129_i;var $sub_ptr_rhs_cast_i=$call128_i;var $sub_ptr_sub_i=$sub_ptr_lhs_cast_i-$sub_ptr_rhs_cast_i|0;var $add137_i=$nb_0+40|0;var $cmp138_i166=$sub_ptr_sub_i>>>0>$add137_i>>>0;var $sub_ptr_sub_tsize_1_i=$cmp138_i166?$sub_ptr_sub_i:$tsize_1_i;var $call128_tbase_1_i=$cmp138_i166?$call128_i:-1;var $cmp144_i=($call128_tbase_1_i|0)==-1;if($cmp144_i){label=340;break}else{var $tsize_291_i=$sub_ptr_sub_tsize_1_i;var $tbase_292_i=$call128_tbase_1_i;label=201;break};case 201:var $tbase_292_i;var $tsize_291_i;var $187=HEAP32[147160>>2];var $add147_i=$187+$tsize_291_i|0;HEAP32[147160>>2]=$add147_i;var $188=HEAP32[147164>>2];var $cmp148_i=$add147_i>>>0>$188>>>0;if($cmp148_i){label=202;break}else{label=203;break};case 202:HEAP32[147164>>2]=$add147_i;label=203;break;case 203:var $189=HEAP32[146752>>2];var $cmp154_i=($189|0)==0;if($cmp154_i){label=204;break}else{var $sp_0105_i=147176;label=211;break};case 204:var $190=HEAP32[146744>>2];var $cmp156_i=($190|0)==0;var $cmp159_i168=$tbase_292_i>>>0<$190>>>0;var $or_cond8_i=$cmp156_i|$cmp159_i168;if($or_cond8_i){label=205;break}else{label=206;break};case 205:HEAP32[146744>>2]=$tbase_292_i;label=206;break;case 206:HEAP32[147176>>2]=$tbase_292_i;HEAP32[147180>>2]=$tsize_291_i;HEAP32[147188>>2]=0;var $191=HEAP32[63152>>2];HEAP32[146764>>2]=$191;HEAP32[146760>>2]=-1;var $i_02_i_i=0;label=207;break;case 207:var $i_02_i_i;var $shl_i_i=$i_02_i_i<<1;var $arrayidx_i_i=146768+($shl_i_i<<2)|0;var $192=$arrayidx_i_i;var $arrayidx_sum_i_i=$shl_i_i+3|0;var $193=146768+($arrayidx_sum_i_i<<2)|0;HEAP32[$193>>2]=$192;var $arrayidx_sum1_i_i=$shl_i_i+2|0;var $194=146768+($arrayidx_sum1_i_i<<2)|0;HEAP32[$194>>2]=$192;var $inc_i_i=$i_02_i_i+1|0;var $cmp_i11_i=$inc_i_i>>>0<32;if($cmp_i11_i){var $i_02_i_i=$inc_i_i;label=207;break}else{label=208;break};case 208:var $sub169_i=$tsize_291_i-40|0;var $add_ptr_i12_i=$tbase_292_i+8|0;var $195=$add_ptr_i12_i;var $and_i13_i=$195&7;var $cmp_i14_i=($and_i13_i|0)==0;if($cmp_i14_i){var $cond_i_i=0;label=210;break}else{label=209;break};case 209:var $196=-$195|0;var $and3_i_i=$196&7;var $cond_i_i=$and3_i_i;label=210;break;case 210:var $cond_i_i;var $add_ptr4_i_i=$tbase_292_i+$cond_i_i|0;var $197=$add_ptr4_i_i;var $sub5_i_i=$sub169_i-$cond_i_i|0;HEAP32[146752>>2]=$197;HEAP32[146740>>2]=$sub5_i_i;var $or_i_i=$sub5_i_i|1;var $add_ptr4_sum_i_i=$cond_i_i+4|0;var $head_i_i=$tbase_292_i+$add_ptr4_sum_i_i|0;var $198=$head_i_i;HEAP32[$198>>2]=$or_i_i;var $add_ptr6_sum_i_i=$tsize_291_i-36|0;var $head7_i_i=$tbase_292_i+$add_ptr6_sum_i_i|0;var $199=$head7_i_i;HEAP32[$199>>2]=40;var $200=HEAP32[63168>>2];HEAP32[146756>>2]=$200;label=338;break;case 211:var $sp_0105_i;var $base184_i=$sp_0105_i|0;var $201=HEAP32[$base184_i>>2];var $size185_i=$sp_0105_i+4|0;var $202=HEAP32[$size185_i>>2];var $add_ptr186_i=$201+$202|0;var $cmp187_i=($tbase_292_i|0)==($add_ptr186_i|0);if($cmp187_i){label=213;break}else{label=212;break};case 212:var $next_i=$sp_0105_i+8|0;var $203=HEAP32[$next_i>>2];var $cmp183_i=($203|0)==0;if($cmp183_i){label=218;break}else{var $sp_0105_i=$203;label=211;break};case 213:var $sflags190_i=$sp_0105_i+12|0;var $204=HEAP32[$sflags190_i>>2];var $and191_i=$204&8;var $tobool192_i=($and191_i|0)==0;if($tobool192_i){label=214;break}else{label=218;break};case 214:var $205=$189;var $cmp200_i=$205>>>0>=$201>>>0;var $cmp206_i=$205>>>0<$tbase_292_i>>>0;var $or_cond94_i=$cmp200_i&$cmp206_i;if($or_cond94_i){label=215;break}else{label=218;break};case 215:var $add209_i=$202+$tsize_291_i|0;HEAP32[$size185_i>>2]=$add209_i;var $206=HEAP32[146752>>2];var $207=HEAP32[146740>>2];var $add212_i=$207+$tsize_291_i|0;var $208=$206;var $add_ptr_i23_i=$206+8|0;var $209=$add_ptr_i23_i;var $and_i24_i=$209&7;var $cmp_i25_i=($and_i24_i|0)==0;if($cmp_i25_i){var $cond_i28_i=0;label=217;break}else{label=216;break};case 216:var $210=-$209|0;var $and3_i26_i=$210&7;var $cond_i28_i=$and3_i26_i;label=217;break;case 217:var $cond_i28_i;var $add_ptr4_i29_i=$208+$cond_i28_i|0;var $211=$add_ptr4_i29_i;var $sub5_i30_i=$add212_i-$cond_i28_i|0;HEAP32[146752>>2]=$211;HEAP32[146740>>2]=$sub5_i30_i;var $or_i31_i=$sub5_i30_i|1;var $add_ptr4_sum_i32_i=$cond_i28_i+4|0;var $head_i33_i=$208+$add_ptr4_sum_i32_i|0;var $212=$head_i33_i;HEAP32[$212>>2]=$or_i31_i;var $add_ptr6_sum_i34_i=$add212_i+4|0;var $head7_i35_i=$208+$add_ptr6_sum_i34_i|0;var $213=$head7_i35_i;HEAP32[$213>>2]=40;var $214=HEAP32[63168>>2];HEAP32[146756>>2]=$214;label=338;break;case 218:var $215=HEAP32[146744>>2];var $cmp215_i=$tbase_292_i>>>0<$215>>>0;if($cmp215_i){label=219;break}else{label=220;break};case 219:HEAP32[146744>>2]=$tbase_292_i;label=220;break;case 220:var $add_ptr224_i=$tbase_292_i+$tsize_291_i|0;var $sp_1101_i=147176;label=221;break;case 221:var $sp_1101_i;var $base223_i=$sp_1101_i|0;var $216=HEAP32[$base223_i>>2];var $cmp225_i=($216|0)==($add_ptr224_i|0);if($cmp225_i){label=223;break}else{label=222;break};case 222:var $next228_i=$sp_1101_i+8|0;var $217=HEAP32[$next228_i>>2];var $cmp221_i=($217|0)==0;if($cmp221_i){label=304;break}else{var $sp_1101_i=$217;label=221;break};case 223:var $sflags232_i=$sp_1101_i+12|0;var $218=HEAP32[$sflags232_i>>2];var $and233_i=$218&8;var $tobool234_i=($and233_i|0)==0;if($tobool234_i){label=224;break}else{label=304;break};case 224:HEAP32[$base223_i>>2]=$tbase_292_i;var $size242_i=$sp_1101_i+4|0;var $219=HEAP32[$size242_i>>2];var $add243_i=$219+$tsize_291_i|0;HEAP32[$size242_i>>2]=$add243_i;var $add_ptr_i38_i=$tbase_292_i+8|0;var $220=$add_ptr_i38_i;var $and_i39_i=$220&7;var $cmp_i40_i=($and_i39_i|0)==0;if($cmp_i40_i){var $cond_i43_i=0;label=226;break}else{label=225;break};case 225:var $221=-$220|0;var $and3_i41_i=$221&7;var $cond_i43_i=$and3_i41_i;label=226;break;case 226:var $cond_i43_i;var $add_ptr4_i44_i=$tbase_292_i+$cond_i43_i|0;var $add_ptr224_sum_i=$tsize_291_i+8|0;var $add_ptr5_i_i=$tbase_292_i+$add_ptr224_sum_i|0;var $222=$add_ptr5_i_i;var $and6_i45_i=$222&7;var $cmp7_i_i=($and6_i45_i|0)==0;if($cmp7_i_i){var $cond15_i_i=0;label=228;break}else{label=227;break};case 227:var $223=-$222|0;var $and13_i_i=$223&7;var $cond15_i_i=$and13_i_i;label=228;break;case 228:var $cond15_i_i;var $add_ptr224_sum122_i=$cond15_i_i+$tsize_291_i|0;var $add_ptr16_i_i=$tbase_292_i+$add_ptr224_sum122_i|0;var $224=$add_ptr16_i_i;var $sub_ptr_lhs_cast_i47_i=$add_ptr16_i_i;var $sub_ptr_rhs_cast_i48_i=$add_ptr4_i44_i;var $sub_ptr_sub_i49_i=$sub_ptr_lhs_cast_i47_i-$sub_ptr_rhs_cast_i48_i|0;var $add_ptr4_sum_i50_i=$cond_i43_i+$nb_0|0;var $add_ptr17_i_i=$tbase_292_i+$add_ptr4_sum_i50_i|0;var $225=$add_ptr17_i_i;var $sub18_i_i=$sub_ptr_sub_i49_i-$nb_0|0;var $or19_i_i=$nb_0|3;var $add_ptr4_sum1_i_i=$cond_i43_i+4|0;var $head_i51_i=$tbase_292_i+$add_ptr4_sum1_i_i|0;var $226=$head_i51_i;HEAP32[$226>>2]=$or19_i_i;var $227=HEAP32[146752>>2];var $cmp20_i_i=($224|0)==($227|0);if($cmp20_i_i){label=229;break}else{label=230;break};case 229:var $228=HEAP32[146740>>2];var $add_i_i=$228+$sub18_i_i|0;HEAP32[146740>>2]=$add_i_i;HEAP32[146752>>2]=$225;var $or22_i_i=$add_i_i|1;var $add_ptr17_sum39_i_i=$add_ptr4_sum_i50_i+4|0;var $head23_i_i=$tbase_292_i+$add_ptr17_sum39_i_i|0;var $229=$head23_i_i;HEAP32[$229>>2]=$or22_i_i;label=303;break;case 230:var $230=HEAP32[146748>>2];var $cmp24_i_i=($224|0)==($230|0);if($cmp24_i_i){label=231;break}else{label=232;break};case 231:var $231=HEAP32[146736>>2];var $add26_i_i=$231+$sub18_i_i|0;HEAP32[146736>>2]=$add26_i_i;HEAP32[146748>>2]=$225;var $or28_i_i=$add26_i_i|1;var $add_ptr17_sum37_i_i=$add_ptr4_sum_i50_i+4|0;var $head29_i_i=$tbase_292_i+$add_ptr17_sum37_i_i|0;var $232=$head29_i_i;HEAP32[$232>>2]=$or28_i_i;var $add_ptr17_sum38_i_i=$add26_i_i+$add_ptr4_sum_i50_i|0;var $add_ptr30_i53_i=$tbase_292_i+$add_ptr17_sum38_i_i|0;var $prev_foot_i54_i=$add_ptr30_i53_i;HEAP32[$prev_foot_i54_i>>2]=$add26_i_i;label=303;break;case 232:var $add_ptr16_sum_i_i=$tsize_291_i+4|0;var $add_ptr224_sum123_i=$add_ptr16_sum_i_i+$cond15_i_i|0;var $head32_i_i=$tbase_292_i+$add_ptr224_sum123_i|0;var $233=$head32_i_i;var $234=HEAP32[$233>>2];var $and33_i_i=$234&3;var $cmp34_i_i=($and33_i_i|0)==1;if($cmp34_i_i){label=233;break}else{var $oldfirst_0_i_i=$224;var $qsize_0_i_i=$sub18_i_i;label=280;break};case 233:var $and37_i_i=$234&-8;var $shr_i55_i=$234>>>3;var $cmp38_i_i=$234>>>0<256;if($cmp38_i_i){label=234;break}else{label=246;break};case 234:var $add_ptr16_sum3233_i_i=$cond15_i_i|8;var $add_ptr224_sum133_i=$add_ptr16_sum3233_i_i+$tsize_291_i|0;var $fd_i_i=$tbase_292_i+$add_ptr224_sum133_i|0;var $235=$fd_i_i;var $236=HEAP32[$235>>2];var $add_ptr16_sum34_i_i=$tsize_291_i+12|0;var $add_ptr224_sum134_i=$add_ptr16_sum34_i_i+$cond15_i_i|0;var $bk_i56_i=$tbase_292_i+$add_ptr224_sum134_i|0;var $237=$bk_i56_i;var $238=HEAP32[$237>>2];var $shl_i57_i=$shr_i55_i<<1;var $arrayidx_i58_i=146768+($shl_i57_i<<2)|0;var $239=$arrayidx_i58_i;var $cmp41_i_i=($236|0)==($239|0);if($cmp41_i_i){label=237;break}else{label=235;break};case 235:var $240=$236;var $241=HEAP32[146744>>2];var $cmp42_i_i=$240>>>0<$241>>>0;if($cmp42_i_i){label=245;break}else{label=236;break};case 236:var $bk43_i_i=$236+12|0;var $242=HEAP32[$bk43_i_i>>2];var $cmp44_i_i=($242|0)==($224|0);if($cmp44_i_i){label=237;break}else{label=245;break};case 237:var $cmp46_i60_i=($238|0)==($236|0);if($cmp46_i60_i){label=238;break}else{label=239;break};case 238:var $shl48_i_i=1<<$shr_i55_i;var $neg_i_i=~$shl48_i_i;var $243=HEAP32[146728>>2];var $and49_i_i=$243&$neg_i_i;HEAP32[146728>>2]=$and49_i_i;label=279;break;case 239:var $cmp54_i_i=($238|0)==($239|0);if($cmp54_i_i){label=240;break}else{label=241;break};case 240:var $fd68_pre_i_i=$238+8|0;var $fd68_pre_phi_i_i=$fd68_pre_i_i;label=243;break;case 241:var $244=$238;var $245=HEAP32[146744>>2];var $cmp57_i_i=$244>>>0<$245>>>0;if($cmp57_i_i){label=244;break}else{label=242;break};case 242:var $fd59_i_i=$238+8|0;var $246=HEAP32[$fd59_i_i>>2];var $cmp60_i_i=($246|0)==($224|0);if($cmp60_i_i){var $fd68_pre_phi_i_i=$fd59_i_i;label=243;break}else{label=244;break};case 243:var $fd68_pre_phi_i_i;var $bk67_i_i=$236+12|0;HEAP32[$bk67_i_i>>2]=$238;HEAP32[$fd68_pre_phi_i_i>>2]=$236;label=279;break;case 244:_abort();case 245:_abort();case 246:var $247=$add_ptr16_i_i;var $add_ptr16_sum23_i_i=$cond15_i_i|24;var $add_ptr224_sum124_i=$add_ptr16_sum23_i_i+$tsize_291_i|0;var $parent_i62_i=$tbase_292_i+$add_ptr224_sum124_i|0;var $248=$parent_i62_i;var $249=HEAP32[$248>>2];var $add_ptr16_sum4_i_i=$tsize_291_i+12|0;var $add_ptr224_sum125_i=$add_ptr16_sum4_i_i+$cond15_i_i|0;var $bk74_i_i=$tbase_292_i+$add_ptr224_sum125_i|0;var $250=$bk74_i_i;var $251=HEAP32[$250>>2];var $cmp75_i_i=($251|0)==($247|0);if($cmp75_i_i){label=252;break}else{label=247;break};case 247:var $add_ptr16_sum2930_i_i=$cond15_i_i|8;var $add_ptr224_sum126_i=$add_ptr16_sum2930_i_i+$tsize_291_i|0;var $fd78_i_i=$tbase_292_i+$add_ptr224_sum126_i|0;var $252=$fd78_i_i;var $253=HEAP32[$252>>2];var $254=$253;var $255=HEAP32[146744>>2];var $cmp81_i_i=$254>>>0<$255>>>0;if($cmp81_i_i){label=251;break}else{label=248;break};case 248:var $bk82_i_i=$253+12|0;var $256=HEAP32[$bk82_i_i>>2];var $cmp83_i_i=($256|0)==($247|0);if($cmp83_i_i){label=249;break}else{label=251;break};case 249:var $fd85_i_i=$251+8|0;var $257=HEAP32[$fd85_i_i>>2];var $cmp86_i_i=($257|0)==($247|0);if($cmp86_i_i){label=250;break}else{label=251;break};case 250:HEAP32[$bk82_i_i>>2]=$251;HEAP32[$fd85_i_i>>2]=$253;var $R_1_i_i=$251;label=259;break;case 251:_abort();case 252:var $add_ptr16_sum56_i_i=$cond15_i_i|16;var $add_ptr224_sum131_i=$add_ptr16_sum_i_i+$add_ptr16_sum56_i_i|0;var $arrayidx96_i_i=$tbase_292_i+$add_ptr224_sum131_i|0;var $258=$arrayidx96_i_i;var $259=HEAP32[$258>>2];var $cmp97_i_i=($259|0)==0;if($cmp97_i_i){label=253;break}else{var $R_0_i_i=$259;var $RP_0_i_i=$258;label=254;break};case 253:var $add_ptr224_sum132_i=$add_ptr16_sum56_i_i+$tsize_291_i|0;var $child_i_i=$tbase_292_i+$add_ptr224_sum132_i|0;var $arrayidx99_i_i=$child_i_i;var $260=HEAP32[$arrayidx99_i_i>>2];var $cmp100_i_i=($260|0)==0;if($cmp100_i_i){var $R_1_i_i=0;label=259;break}else{var $R_0_i_i=$260;var $RP_0_i_i=$arrayidx99_i_i;label=254;break};case 254:var $RP_0_i_i;var $R_0_i_i;var $arrayidx103_i_i=$R_0_i_i+20|0;var $261=HEAP32[$arrayidx103_i_i>>2];var $cmp104_i_i=($261|0)==0;if($cmp104_i_i){label=255;break}else{var $R_0_i_i=$261;var $RP_0_i_i=$arrayidx103_i_i;label=254;break};case 255:var $arrayidx107_i_i=$R_0_i_i+16|0;var $262=HEAP32[$arrayidx107_i_i>>2];var $cmp108_i_i=($262|0)==0;if($cmp108_i_i){label=256;break}else{var $R_0_i_i=$262;var $RP_0_i_i=$arrayidx107_i_i;label=254;break};case 256:var $263=$RP_0_i_i;var $264=HEAP32[146744>>2];var $cmp112_i_i=$263>>>0<$264>>>0;if($cmp112_i_i){label=258;break}else{label=257;break};case 257:HEAP32[$RP_0_i_i>>2]=0;var $R_1_i_i=$R_0_i_i;label=259;break;case 258:_abort();case 259:var $R_1_i_i;var $cmp120_i64_i=($249|0)==0;if($cmp120_i64_i){label=279;break}else{label=260;break};case 260:var $add_ptr16_sum26_i_i=$tsize_291_i+28|0;var $add_ptr224_sum127_i=$add_ptr16_sum26_i_i+$cond15_i_i|0;var $index_i65_i=$tbase_292_i+$add_ptr224_sum127_i|0;var $265=$index_i65_i;var $266=HEAP32[$265>>2];var $arrayidx123_i_i=147032+($266<<2)|0;var $267=HEAP32[$arrayidx123_i_i>>2];var $cmp124_i_i=($247|0)==($267|0);if($cmp124_i_i){label=261;break}else{label=263;break};case 261:HEAP32[$arrayidx123_i_i>>2]=$R_1_i_i;var $cond41_i_i=($R_1_i_i|0)==0;if($cond41_i_i){label=262;break}else{label=269;break};case 262:var $268=HEAP32[$265>>2];var $shl131_i_i=1<<$268;var $neg132_i_i=~$shl131_i_i;var $269=HEAP32[146732>>2];var $and133_i_i=$269&$neg132_i_i;HEAP32[146732>>2]=$and133_i_i;label=279;break;case 263:var $270=$249;var $271=HEAP32[146744>>2];var $cmp137_i_i=$270>>>0<$271>>>0;if($cmp137_i_i){label=267;break}else{label=264;break};case 264:var $arrayidx143_i_i=$249+16|0;var $272=HEAP32[$arrayidx143_i_i>>2];var $cmp144_i_i=($272|0)==($247|0);if($cmp144_i_i){label=265;break}else{label=266;break};case 265:HEAP32[$arrayidx143_i_i>>2]=$R_1_i_i;label=268;break;case 266:var $arrayidx151_i_i=$249+20|0;HEAP32[$arrayidx151_i_i>>2]=$R_1_i_i;label=268;break;case 267:_abort();case 268:var $cmp156_i_i=($R_1_i_i|0)==0;if($cmp156_i_i){label=279;break}else{label=269;break};case 269:var $273=$R_1_i_i;var $274=HEAP32[146744>>2];var $cmp160_i_i=$273>>>0<$274>>>0;if($cmp160_i_i){label=278;break}else{label=270;break};case 270:var $parent165_i_i=$R_1_i_i+24|0;HEAP32[$parent165_i_i>>2]=$249;var $add_ptr16_sum2728_i_i=$cond15_i_i|16;var $add_ptr224_sum128_i=$add_ptr16_sum2728_i_i+$tsize_291_i|0;var $child166_i_i=$tbase_292_i+$add_ptr224_sum128_i|0;var $arrayidx167_i_i=$child166_i_i;var $275=HEAP32[$arrayidx167_i_i>>2];var $cmp168_i_i=($275|0)==0;if($cmp168_i_i){label=274;break}else{label=271;break};case 271:var $276=$275;var $277=HEAP32[146744>>2];var $cmp172_i_i=$276>>>0<$277>>>0;if($cmp172_i_i){label=273;break}else{label=272;break};case 272:var $arrayidx178_i_i=$R_1_i_i+16|0;HEAP32[$arrayidx178_i_i>>2]=$275;var $parent179_i_i=$275+24|0;HEAP32[$parent179_i_i>>2]=$R_1_i_i;label=274;break;case 273:_abort();case 274:var $add_ptr224_sum129_i=$add_ptr16_sum_i_i+$add_ptr16_sum2728_i_i|0;var $arrayidx184_i_i=$tbase_292_i+$add_ptr224_sum129_i|0;var $278=$arrayidx184_i_i;var $279=HEAP32[$278>>2];var $cmp185_i_i=($279|0)==0;if($cmp185_i_i){label=279;break}else{label=275;break};case 275:var $280=$279;var $281=HEAP32[146744>>2];var $cmp189_i_i=$280>>>0<$281>>>0;if($cmp189_i_i){label=277;break}else{label=276;break};case 276:var $arrayidx195_i_i=$R_1_i_i+20|0;HEAP32[$arrayidx195_i_i>>2]=$279;var $parent196_i_i=$279+24|0;HEAP32[$parent196_i_i>>2]=$R_1_i_i;label=279;break;case 277:_abort();case 278:_abort();case 279:var $add_ptr16_sum7_i_i=$and37_i_i|$cond15_i_i;var $add_ptr224_sum130_i=$add_ptr16_sum7_i_i+$tsize_291_i|0;var $add_ptr205_i_i=$tbase_292_i+$add_ptr224_sum130_i|0;var $282=$add_ptr205_i_i;var $add206_i_i=$and37_i_i+$sub18_i_i|0;var $oldfirst_0_i_i=$282;var $qsize_0_i_i=$add206_i_i;label=280;break;case 280:var $qsize_0_i_i;var $oldfirst_0_i_i;var $head208_i_i=$oldfirst_0_i_i+4|0;var $283=HEAP32[$head208_i_i>>2];var $and209_i_i=$283&-2;HEAP32[$head208_i_i>>2]=$and209_i_i;var $or210_i_i=$qsize_0_i_i|1;var $add_ptr17_sum_i_i=$add_ptr4_sum_i50_i+4|0;var $head211_i_i=$tbase_292_i+$add_ptr17_sum_i_i|0;var $284=$head211_i_i;HEAP32[$284>>2]=$or210_i_i;var $add_ptr17_sum8_i_i=$qsize_0_i_i+$add_ptr4_sum_i50_i|0;var $add_ptr212_i_i=$tbase_292_i+$add_ptr17_sum8_i_i|0;var $prev_foot213_i_i=$add_ptr212_i_i;HEAP32[$prev_foot213_i_i>>2]=$qsize_0_i_i;var $shr214_i_i=$qsize_0_i_i>>>3;var $cmp215_i_i=$qsize_0_i_i>>>0<256;if($cmp215_i_i){label=281;break}else{label=286;break};case 281:var $shl221_i_i=$shr214_i_i<<1;var $arrayidx223_i_i=146768+($shl221_i_i<<2)|0;var $285=$arrayidx223_i_i;var $286=HEAP32[146728>>2];var $shl226_i_i=1<<$shr214_i_i;var $and227_i_i=$286&$shl226_i_i;var $tobool228_i_i=($and227_i_i|0)==0;if($tobool228_i_i){label=282;break}else{label=283;break};case 282:var $or232_i_i=$286|$shl226_i_i;HEAP32[146728>>2]=$or232_i_i;var $arrayidx223_sum_pre_i_i=$shl221_i_i+2|0;var $_pre_i67_i=146768+($arrayidx223_sum_pre_i_i<<2)|0;var $F224_0_i_i=$285;var $_pre_phi_i68_i=$_pre_i67_i;label=285;break;case 283:var $arrayidx223_sum25_i_i=$shl221_i_i+2|0;var $287=146768+($arrayidx223_sum25_i_i<<2)|0;var $288=HEAP32[$287>>2];var $289=$288;var $290=HEAP32[146744>>2];var $cmp236_i_i=$289>>>0<$290>>>0;if($cmp236_i_i){label=284;break}else{var $F224_0_i_i=$288;var $_pre_phi_i68_i=$287;label=285;break};case 284:_abort();case 285:var $_pre_phi_i68_i;var $F224_0_i_i;HEAP32[$_pre_phi_i68_i>>2]=$225;var $bk246_i_i=$F224_0_i_i+12|0;HEAP32[$bk246_i_i>>2]=$225;var $add_ptr17_sum23_i_i=$add_ptr4_sum_i50_i+8|0;var $fd247_i_i=$tbase_292_i+$add_ptr17_sum23_i_i|0;var $291=$fd247_i_i;HEAP32[$291>>2]=$F224_0_i_i;var $add_ptr17_sum24_i_i=$add_ptr4_sum_i50_i+12|0;var $bk248_i_i=$tbase_292_i+$add_ptr17_sum24_i_i|0;var $292=$bk248_i_i;HEAP32[$292>>2]=$285;label=303;break;case 286:var $293=$add_ptr17_i_i;var $shr253_i_i=$qsize_0_i_i>>>8;var $cmp254_i_i=($shr253_i_i|0)==0;if($cmp254_i_i){var $I252_0_i_i=0;label=289;break}else{label=287;break};case 287:var $cmp258_i_i=$qsize_0_i_i>>>0>16777215;if($cmp258_i_i){var $I252_0_i_i=31;label=289;break}else{label=288;break};case 288:var $sub262_i_i=$shr253_i_i+1048320|0;var $shr263_i_i=$sub262_i_i>>>16;var $and264_i_i=$shr263_i_i&8;var $shl265_i_i=$shr253_i_i<<$and264_i_i;var $sub266_i_i=$shl265_i_i+520192|0;var $shr267_i_i=$sub266_i_i>>>16;var $and268_i_i=$shr267_i_i&4;var $add269_i_i=$and268_i_i|$and264_i_i;var $shl270_i_i=$shl265_i_i<<$and268_i_i;var $sub271_i_i=$shl270_i_i+245760|0;var $shr272_i_i=$sub271_i_i>>>16;var $and273_i_i=$shr272_i_i&2;var $add274_i_i=$add269_i_i|$and273_i_i;var $sub275_i_i=14-$add274_i_i|0;var $shl276_i_i=$shl270_i_i<<$and273_i_i;var $shr277_i_i=$shl276_i_i>>>15;var $add278_i_i=$sub275_i_i+$shr277_i_i|0;var $shl279_i_i=$add278_i_i<<1;var $add280_i_i=$add278_i_i+7|0;var $shr281_i_i=$qsize_0_i_i>>>($add280_i_i>>>0);var $and282_i_i=$shr281_i_i&1;var $add283_i_i=$and282_i_i|$shl279_i_i;var $I252_0_i_i=$add283_i_i;label=289;break;case 289:var $I252_0_i_i;var $arrayidx287_i_i=147032+($I252_0_i_i<<2)|0;var $add_ptr17_sum9_i_i=$add_ptr4_sum_i50_i+28|0;var $index288_i_i=$tbase_292_i+$add_ptr17_sum9_i_i|0;var $294=$index288_i_i;HEAP32[$294>>2]=$I252_0_i_i;var $add_ptr17_sum10_i_i=$add_ptr4_sum_i50_i+16|0;var $child289_i_i=$tbase_292_i+$add_ptr17_sum10_i_i|0;var $child289_sum_i_i=$add_ptr4_sum_i50_i+20|0;var $arrayidx290_i_i=$tbase_292_i+$child289_sum_i_i|0;var $295=$arrayidx290_i_i;HEAP32[$295>>2]=0;var $arrayidx292_i_i=$child289_i_i;HEAP32[$arrayidx292_i_i>>2]=0;var $296=HEAP32[146732>>2];var $shl294_i_i=1<<$I252_0_i_i;var $and295_i_i=$296&$shl294_i_i;var $tobool296_i_i=($and295_i_i|0)==0;if($tobool296_i_i){label=290;break}else{label=291;break};case 290:var $or300_i_i=$296|$shl294_i_i;HEAP32[146732>>2]=$or300_i_i;HEAP32[$arrayidx287_i_i>>2]=$293;var $297=$arrayidx287_i_i;var $add_ptr17_sum11_i_i=$add_ptr4_sum_i50_i+24|0;var $parent301_i_i=$tbase_292_i+$add_ptr17_sum11_i_i|0;var $298=$parent301_i_i;HEAP32[$298>>2]=$297;var $add_ptr17_sum12_i_i=$add_ptr4_sum_i50_i+12|0;var $bk302_i_i=$tbase_292_i+$add_ptr17_sum12_i_i|0;var $299=$bk302_i_i;HEAP32[$299>>2]=$293;var $add_ptr17_sum13_i_i=$add_ptr4_sum_i50_i+8|0;var $fd303_i_i=$tbase_292_i+$add_ptr17_sum13_i_i|0;var $300=$fd303_i_i;HEAP32[$300>>2]=$293;label=303;break;case 291:var $301=HEAP32[$arrayidx287_i_i>>2];var $cmp306_i_i=($I252_0_i_i|0)==31;if($cmp306_i_i){var $cond315_i_i=0;label=293;break}else{label=292;break};case 292:var $shr310_i_i=$I252_0_i_i>>>1;var $sub313_i_i=25-$shr310_i_i|0;var $cond315_i_i=$sub313_i_i;label=293;break;case 293:var $cond315_i_i;var $shl316_i_i=$qsize_0_i_i<<$cond315_i_i;var $K305_0_i_i=$shl316_i_i;var $T_0_i69_i=$301;label=294;break;case 294:var $T_0_i69_i;var $K305_0_i_i;var $head317_i_i=$T_0_i69_i+4|0;var $302=HEAP32[$head317_i_i>>2];var $and318_i_i=$302&-8;var $cmp319_i_i=($and318_i_i|0)==($qsize_0_i_i|0);if($cmp319_i_i){label=299;break}else{label=295;break};case 295:var $shr322_i_i=$K305_0_i_i>>>31;var $arrayidx325_i_i=$T_0_i69_i+16+($shr322_i_i<<2)|0;var $303=HEAP32[$arrayidx325_i_i>>2];var $cmp327_i_i=($303|0)==0;var $shl326_i_i=$K305_0_i_i<<1;if($cmp327_i_i){label=296;break}else{var $K305_0_i_i=$shl326_i_i;var $T_0_i69_i=$303;label=294;break};case 296:var $304=$arrayidx325_i_i;var $305=HEAP32[146744>>2];var $cmp332_i_i=$304>>>0<$305>>>0;if($cmp332_i_i){label=298;break}else{label=297;break};case 297:HEAP32[$arrayidx325_i_i>>2]=$293;var $add_ptr17_sum20_i_i=$add_ptr4_sum_i50_i+24|0;var $parent337_i_i=$tbase_292_i+$add_ptr17_sum20_i_i|0;var $306=$parent337_i_i;HEAP32[$306>>2]=$T_0_i69_i;var $add_ptr17_sum21_i_i=$add_ptr4_sum_i50_i+12|0;var $bk338_i_i=$tbase_292_i+$add_ptr17_sum21_i_i|0;var $307=$bk338_i_i;HEAP32[$307>>2]=$293;var $add_ptr17_sum22_i_i=$add_ptr4_sum_i50_i+8|0;var $fd339_i_i=$tbase_292_i+$add_ptr17_sum22_i_i|0;var $308=$fd339_i_i;HEAP32[$308>>2]=$293;label=303;break;case 298:_abort();case 299:var $fd344_i_i=$T_0_i69_i+8|0;var $309=HEAP32[$fd344_i_i>>2];var $310=$T_0_i69_i;var $311=HEAP32[146744>>2];var $cmp346_i_i=$310>>>0<$311>>>0;if($cmp346_i_i){label=302;break}else{label=300;break};case 300:var $312=$309;var $cmp350_i_i=$312>>>0<$311>>>0;if($cmp350_i_i){label=302;break}else{label=301;break};case 301:var $bk357_i_i=$309+12|0;HEAP32[$bk357_i_i>>2]=$293;HEAP32[$fd344_i_i>>2]=$293;var $add_ptr17_sum17_i_i=$add_ptr4_sum_i50_i+8|0;var $fd359_i_i=$tbase_292_i+$add_ptr17_sum17_i_i|0;var $313=$fd359_i_i;HEAP32[$313>>2]=$309;var $add_ptr17_sum18_i_i=$add_ptr4_sum_i50_i+12|0;var $bk360_i_i=$tbase_292_i+$add_ptr17_sum18_i_i|0;var $314=$bk360_i_i;HEAP32[$314>>2]=$T_0_i69_i;var $add_ptr17_sum19_i_i=$add_ptr4_sum_i50_i+24|0;var $parent361_i_i=$tbase_292_i+$add_ptr17_sum19_i_i|0;var $315=$parent361_i_i;HEAP32[$315>>2]=0;label=303;break;case 302:_abort();case 303:var $add_ptr4_sum1415_i_i=$cond_i43_i|8;var $add_ptr368_i_i=$tbase_292_i+$add_ptr4_sum1415_i_i|0;var $mem_0=$add_ptr368_i_i;label=341;break;case 304:var $316=$189;var $sp_0_i_i_i=147176;label=305;break;case 305:var $sp_0_i_i_i;var $base_i_i_i=$sp_0_i_i_i|0;var $317=HEAP32[$base_i_i_i>>2];var $cmp_i_i_i=$317>>>0>$316>>>0;if($cmp_i_i_i){label=307;break}else{label=306;break};case 306:var $size_i_i_i=$sp_0_i_i_i+4|0;var $318=HEAP32[$size_i_i_i>>2];var $add_ptr_i_i_i=$317+$318|0;var $cmp2_i_i_i=$add_ptr_i_i_i>>>0>$316>>>0;if($cmp2_i_i_i){label=308;break}else{label=307;break};case 307:var $next_i_i_i=$sp_0_i_i_i+8|0;var $319=HEAP32[$next_i_i_i>>2];var $sp_0_i_i_i=$319;label=305;break;case 308:var $add_ptr_sum_i_i=$318-47|0;var $add_ptr2_sum_i_i=$318-39|0;var $add_ptr3_i_i=$317+$add_ptr2_sum_i_i|0;var $320=$add_ptr3_i_i;var $and_i15_i=$320&7;var $cmp_i16_i=($and_i15_i|0)==0;if($cmp_i16_i){var $cond_i18_i=0;label=310;break}else{label=309;break};case 309:var $321=-$320|0;var $and6_i_i=$321&7;var $cond_i18_i=$and6_i_i;label=310;break;case 310:var $cond_i18_i;var $add_ptr2_sum1_i_i=$add_ptr_sum_i_i+$cond_i18_i|0;var $add_ptr7_i_i=$317+$add_ptr2_sum1_i_i|0;var $add_ptr82_i_i=$189+16|0;var $add_ptr8_i_i=$add_ptr82_i_i;var $cmp9_i_i=$add_ptr7_i_i>>>0<$add_ptr8_i_i>>>0;var $cond13_i_i=$cmp9_i_i?$316:$add_ptr7_i_i;var $add_ptr14_i_i=$cond13_i_i+8|0;var $322=$add_ptr14_i_i;var $sub16_i_i=$tsize_291_i-40|0;var $add_ptr_i11_i_i=$tbase_292_i+8|0;var $323=$add_ptr_i11_i_i;var $and_i_i_i=$323&7;var $cmp_i12_i_i=($and_i_i_i|0)==0;if($cmp_i12_i_i){var $cond_i_i_i=0;label=312;break}else{label=311;break};case 311:var $324=-$323|0;var $and3_i_i_i=$324&7;var $cond_i_i_i=$and3_i_i_i;label=312;break;case 312:var $cond_i_i_i;var $add_ptr4_i_i_i=$tbase_292_i+$cond_i_i_i|0;var $325=$add_ptr4_i_i_i;var $sub5_i_i_i=$sub16_i_i-$cond_i_i_i|0;HEAP32[146752>>2]=$325;HEAP32[146740>>2]=$sub5_i_i_i;var $or_i_i_i=$sub5_i_i_i|1;var $add_ptr4_sum_i_i_i=$cond_i_i_i+4|0;var $head_i_i_i=$tbase_292_i+$add_ptr4_sum_i_i_i|0;var $326=$head_i_i_i;HEAP32[$326>>2]=$or_i_i_i;var $add_ptr6_sum_i_i_i=$tsize_291_i-36|0;var $head7_i_i_i=$tbase_292_i+$add_ptr6_sum_i_i_i|0;var $327=$head7_i_i_i;HEAP32[$327>>2]=40;var $328=HEAP32[63168>>2];HEAP32[146756>>2]=$328;var $head_i19_i=$cond13_i_i+4|0;var $329=$head_i19_i;HEAP32[$329>>2]=27;HEAP32[$add_ptr14_i_i>>2]=HEAP32[147176>>2];HEAP32[$add_ptr14_i_i+4>>2]=HEAP32[147180>>2];HEAP32[$add_ptr14_i_i+8>>2]=HEAP32[147184>>2];HEAP32[$add_ptr14_i_i+12>>2]=HEAP32[147188>>2];HEAP32[147176>>2]=$tbase_292_i;HEAP32[147180>>2]=$tsize_291_i;HEAP32[147188>>2]=0;HEAP32[147184>>2]=$322;var $add_ptr2414_i_i=$cond13_i_i+28|0;var $330=$add_ptr2414_i_i;HEAP32[$330>>2]=7;var $331=$cond13_i_i+32|0;var $cmp2715_i_i=$331>>>0<$add_ptr_i_i_i>>>0;if($cmp2715_i_i){var $add_ptr2416_i_i=$330;label=313;break}else{label=314;break};case 313:var $add_ptr2416_i_i;var $332=$add_ptr2416_i_i+4|0;HEAP32[$332>>2]=7;var $333=$add_ptr2416_i_i+8|0;var $334=$333;var $cmp27_i_i=$334>>>0<$add_ptr_i_i_i>>>0;if($cmp27_i_i){var $add_ptr2416_i_i=$332;label=313;break}else{label=314;break};case 314:var $cmp28_i_i=($cond13_i_i|0)==($316|0);if($cmp28_i_i){label=338;break}else{label=315;break};case 315:var $sub_ptr_lhs_cast_i_i=$cond13_i_i;var $sub_ptr_rhs_cast_i_i=$189;var $sub_ptr_sub_i_i=$sub_ptr_lhs_cast_i_i-$sub_ptr_rhs_cast_i_i|0;var $add_ptr30_i_i=$316+$sub_ptr_sub_i_i|0;var $add_ptr30_sum_i_i=$sub_ptr_sub_i_i+4|0;var $head31_i_i=$316+$add_ptr30_sum_i_i|0;var $335=$head31_i_i;var $336=HEAP32[$335>>2];var $and32_i_i=$336&-2;HEAP32[$335>>2]=$and32_i_i;var $or33_i_i=$sub_ptr_sub_i_i|1;var $head34_i_i=$189+4|0;HEAP32[$head34_i_i>>2]=$or33_i_i;var $prev_foot_i_i=$add_ptr30_i_i;HEAP32[$prev_foot_i_i>>2]=$sub_ptr_sub_i_i;var $shr_i_i=$sub_ptr_sub_i_i>>>3;var $cmp36_i_i=$sub_ptr_sub_i_i>>>0<256;if($cmp36_i_i){label=316;break}else{label=321;break};case 316:var $shl_i21_i=$shr_i_i<<1;var $arrayidx_i22_i=146768+($shl_i21_i<<2)|0;var $337=$arrayidx_i22_i;var $338=HEAP32[146728>>2];var $shl39_i_i=1<<$shr_i_i;var $and40_i_i=$338&$shl39_i_i;var $tobool_i_i=($and40_i_i|0)==0;if($tobool_i_i){label=317;break}else{label=318;break};case 317:var $or44_i_i=$338|$shl39_i_i;HEAP32[146728>>2]=$or44_i_i;var $arrayidx_sum_pre_i_i=$shl_i21_i+2|0;var $_pre_i_i=146768+($arrayidx_sum_pre_i_i<<2)|0;var $F_0_i_i=$337;var $_pre_phi_i_i=$_pre_i_i;label=320;break;case 318:var $arrayidx_sum10_i_i=$shl_i21_i+2|0;var $339=146768+($arrayidx_sum10_i_i<<2)|0;var $340=HEAP32[$339>>2];var $341=$340;var $342=HEAP32[146744>>2];var $cmp46_i_i=$341>>>0<$342>>>0;if($cmp46_i_i){label=319;break}else{var $F_0_i_i=$340;var $_pre_phi_i_i=$339;label=320;break};case 319:_abort();case 320:var $_pre_phi_i_i;var $F_0_i_i;HEAP32[$_pre_phi_i_i>>2]=$189;var $bk_i_i=$F_0_i_i+12|0;HEAP32[$bk_i_i>>2]=$189;var $fd54_i_i=$189+8|0;HEAP32[$fd54_i_i>>2]=$F_0_i_i;var $bk55_i_i=$189+12|0;HEAP32[$bk55_i_i>>2]=$337;label=338;break;case 321:var $343=$189;var $shr58_i_i=$sub_ptr_sub_i_i>>>8;var $cmp59_i_i=($shr58_i_i|0)==0;if($cmp59_i_i){var $I57_0_i_i=0;label=324;break}else{label=322;break};case 322:var $cmp63_i_i=$sub_ptr_sub_i_i>>>0>16777215;if($cmp63_i_i){var $I57_0_i_i=31;label=324;break}else{label=323;break};case 323:var $sub67_i_i=$shr58_i_i+1048320|0;var $shr68_i_i=$sub67_i_i>>>16;var $and69_i_i=$shr68_i_i&8;var $shl70_i_i=$shr58_i_i<<$and69_i_i;var $sub71_i_i=$shl70_i_i+520192|0;var $shr72_i_i=$sub71_i_i>>>16;var $and73_i_i=$shr72_i_i&4;var $add74_i_i=$and73_i_i|$and69_i_i;var $shl75_i_i=$shl70_i_i<<$and73_i_i;var $sub76_i_i=$shl75_i_i+245760|0;var $shr77_i_i=$sub76_i_i>>>16;var $and78_i_i=$shr77_i_i&2;var $add79_i_i=$add74_i_i|$and78_i_i;var $sub80_i_i=14-$add79_i_i|0;var $shl81_i_i=$shl75_i_i<<$and78_i_i;var $shr82_i_i=$shl81_i_i>>>15;var $add83_i_i=$sub80_i_i+$shr82_i_i|0;var $shl84_i_i=$add83_i_i<<1;var $add85_i_i=$add83_i_i+7|0;var $shr86_i_i=$sub_ptr_sub_i_i>>>($add85_i_i>>>0);var $and87_i_i=$shr86_i_i&1;var $add88_i_i=$and87_i_i|$shl84_i_i;var $I57_0_i_i=$add88_i_i;label=324;break;case 324:var $I57_0_i_i;var $arrayidx91_i_i=147032+($I57_0_i_i<<2)|0;var $index_i_i=$189+28|0;var $I57_0_c_i_i=$I57_0_i_i;HEAP32[$index_i_i>>2]=$I57_0_c_i_i;var $arrayidx92_i_i=$189+20|0;HEAP32[$arrayidx92_i_i>>2]=0;var $344=$189+16|0;HEAP32[$344>>2]=0;var $345=HEAP32[146732>>2];var $shl95_i_i=1<<$I57_0_i_i;var $and96_i_i=$345&$shl95_i_i;var $tobool97_i_i=($and96_i_i|0)==0;if($tobool97_i_i){label=325;break}else{label=326;break};case 325:var $or101_i_i=$345|$shl95_i_i;HEAP32[146732>>2]=$or101_i_i;HEAP32[$arrayidx91_i_i>>2]=$343;var $parent_i_i=$189+24|0;var $_c_i_i=$arrayidx91_i_i;HEAP32[$parent_i_i>>2]=$_c_i_i;var $bk102_i_i=$189+12|0;HEAP32[$bk102_i_i>>2]=$189;var $fd103_i_i=$189+8|0;HEAP32[$fd103_i_i>>2]=$189;label=338;break;case 326:var $346=HEAP32[$arrayidx91_i_i>>2];var $cmp106_i_i=($I57_0_i_i|0)==31;if($cmp106_i_i){var $cond115_i_i=0;label=328;break}else{label=327;break};case 327:var $shr110_i_i=$I57_0_i_i>>>1;var $sub113_i_i=25-$shr110_i_i|0;var $cond115_i_i=$sub113_i_i;label=328;break;case 328:var $cond115_i_i;var $shl116_i_i=$sub_ptr_sub_i_i<<$cond115_i_i;var $K105_0_i_i=$shl116_i_i;var $T_0_i_i=$346;label=329;break;case 329:var $T_0_i_i;var $K105_0_i_i;var $head118_i_i=$T_0_i_i+4|0;var $347=HEAP32[$head118_i_i>>2];var $and119_i_i=$347&-8;var $cmp120_i_i=($and119_i_i|0)==($sub_ptr_sub_i_i|0);if($cmp120_i_i){label=334;break}else{label=330;break};case 330:var $shr123_i_i=$K105_0_i_i>>>31;var $arrayidx126_i_i=$T_0_i_i+16+($shr123_i_i<<2)|0;var $348=HEAP32[$arrayidx126_i_i>>2];var $cmp128_i_i=($348|0)==0;var $shl127_i_i=$K105_0_i_i<<1;if($cmp128_i_i){label=331;break}else{var $K105_0_i_i=$shl127_i_i;var $T_0_i_i=$348;label=329;break};case 331:var $349=$arrayidx126_i_i;var $350=HEAP32[146744>>2];var $cmp133_i_i=$349>>>0<$350>>>0;if($cmp133_i_i){label=333;break}else{label=332;break};case 332:HEAP32[$arrayidx126_i_i>>2]=$343;var $parent138_i_i=$189+24|0;var $T_0_c7_i_i=$T_0_i_i;HEAP32[$parent138_i_i>>2]=$T_0_c7_i_i;var $bk139_i_i=$189+12|0;HEAP32[$bk139_i_i>>2]=$189;var $fd140_i_i=$189+8|0;HEAP32[$fd140_i_i>>2]=$189;label=338;break;case 333:_abort();case 334:var $fd145_i_i=$T_0_i_i+8|0;var $351=HEAP32[$fd145_i_i>>2];var $352=$T_0_i_i;var $353=HEAP32[146744>>2];var $cmp147_i_i=$352>>>0<$353>>>0;if($cmp147_i_i){label=337;break}else{label=335;break};case 335:var $354=$351;var $cmp150_i_i=$354>>>0<$353>>>0;if($cmp150_i_i){label=337;break}else{label=336;break};case 336:var $bk155_i_i=$351+12|0;HEAP32[$bk155_i_i>>2]=$343;HEAP32[$fd145_i_i>>2]=$343;var $fd157_i_i=$189+8|0;var $_c6_i_i=$351;HEAP32[$fd157_i_i>>2]=$_c6_i_i;var $bk158_i_i=$189+12|0;var $T_0_c_i_i=$T_0_i_i;HEAP32[$bk158_i_i>>2]=$T_0_c_i_i;var $parent159_i_i=$189+24|0;HEAP32[$parent159_i_i>>2]=0;label=338;break;case 337:_abort();case 338:var $355=HEAP32[146740>>2];var $cmp250_i=$355>>>0>$nb_0>>>0;if($cmp250_i){label=339;break}else{label=340;break};case 339:var $sub253_i=$355-$nb_0|0;HEAP32[146740>>2]=$sub253_i;var $356=HEAP32[146752>>2];var $357=$356;var $add_ptr255_i=$357+$nb_0|0;var $358=$add_ptr255_i;HEAP32[146752>>2]=$358;var $or257_i=$sub253_i|1;var $add_ptr255_sum_i=$nb_0+4|0;var $head258_i=$357+$add_ptr255_sum_i|0;var $359=$head258_i;HEAP32[$359>>2]=$or257_i;var $or260_i=$nb_0|3;var $head261_i=$356+4|0;HEAP32[$head261_i>>2]=$or260_i;var $add_ptr262_i=$356+8|0;var $360=$add_ptr262_i;var $mem_0=$360;label=341;break;case 340:var $call265_i=___errno_location();HEAP32[$call265_i>>2]=12;var $mem_0=0;label=341;break;case 341:var $mem_0;return $mem_0}}function _free($mem){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($mem|0)==0;if($cmp){label=140;break}else{label=2;break};case 2:var $add_ptr=$mem-8|0;var $0=$add_ptr;var $1=HEAP32[146744>>2];var $cmp1=$add_ptr>>>0<$1>>>0;if($cmp1){label=139;break}else{label=3;break};case 3:var $head=$mem-4|0;var $2=$head;var $3=HEAP32[$2>>2];var $and=$3&3;var $cmp2=($and|0)==1;if($cmp2){label=139;break}else{label=4;break};case 4:var $and5=$3&-8;var $add_ptr_sum=$and5-8|0;var $add_ptr6=$mem+$add_ptr_sum|0;var $4=$add_ptr6;var $and8=$3&1;var $tobool9=($and8|0)==0;if($tobool9){label=5;break}else{var $p_0=$0;var $psize_0=$and5;label=56;break};case 5:var $prev_foot=$add_ptr;var $5=HEAP32[$prev_foot>>2];var $cmp13=($and|0)==0;if($cmp13){label=140;break}else{label=6;break};case 6:var $add_ptr_sum231=-8-$5|0;var $add_ptr16=$mem+$add_ptr_sum231|0;var $6=$add_ptr16;var $add17=$5+$and5|0;var $cmp18=$add_ptr16>>>0<$1>>>0;if($cmp18){label=139;break}else{label=7;break};case 7:var $7=HEAP32[146748>>2];var $cmp22=($6|0)==($7|0);if($cmp22){label=54;break}else{label=8;break};case 8:var $shr=$5>>>3;var $cmp25=$5>>>0<256;if($cmp25){label=9;break}else{label=21;break};case 9:var $add_ptr16_sum268=$add_ptr_sum231+8|0;var $fd=$mem+$add_ptr16_sum268|0;var $8=$fd;var $9=HEAP32[$8>>2];var $add_ptr16_sum269=$add_ptr_sum231+12|0;var $bk=$mem+$add_ptr16_sum269|0;var $10=$bk;var $11=HEAP32[$10>>2];var $shl=$shr<<1;var $arrayidx=146768+($shl<<2)|0;var $12=$arrayidx;var $cmp29=($9|0)==($12|0);if($cmp29){label=12;break}else{label=10;break};case 10:var $13=$9;var $cmp31=$13>>>0<$1>>>0;if($cmp31){label=20;break}else{label=11;break};case 11:var $bk34=$9+12|0;var $14=HEAP32[$bk34>>2];var $cmp35=($14|0)==($6|0);if($cmp35){label=12;break}else{label=20;break};case 12:var $cmp42=($11|0)==($9|0);if($cmp42){label=13;break}else{label=14;break};case 13:var $shl45=1<<$shr;var $neg=~$shl45;var $15=HEAP32[146728>>2];var $and46=$15&$neg;HEAP32[146728>>2]=$and46;var $p_0=$6;var $psize_0=$add17;label=56;break;case 14:var $cmp50=($11|0)==($12|0);if($cmp50){label=15;break}else{label=16;break};case 15:var $fd67_pre=$11+8|0;var $fd67_pre_phi=$fd67_pre;label=18;break;case 16:var $16=$11;var $cmp53=$16>>>0<$1>>>0;if($cmp53){label=19;break}else{label=17;break};case 17:var $fd56=$11+8|0;var $17=HEAP32[$fd56>>2];var $cmp57=($17|0)==($6|0);if($cmp57){var $fd67_pre_phi=$fd56;label=18;break}else{label=19;break};case 18:var $fd67_pre_phi;var $bk66=$9+12|0;HEAP32[$bk66>>2]=$11;HEAP32[$fd67_pre_phi>>2]=$9;var $p_0=$6;var $psize_0=$add17;label=56;break;case 19:_abort();case 20:_abort();case 21:var $18=$add_ptr16;var $add_ptr16_sum260=$add_ptr_sum231+24|0;var $parent=$mem+$add_ptr16_sum260|0;var $19=$parent;var $20=HEAP32[$19>>2];var $add_ptr16_sum261=$add_ptr_sum231+12|0;var $bk73=$mem+$add_ptr16_sum261|0;var $21=$bk73;var $22=HEAP32[$21>>2];var $cmp74=($22|0)==($18|0);if($cmp74){label=27;break}else{label=22;break};case 22:var $add_ptr16_sum265=$add_ptr_sum231+8|0;var $fd78=$mem+$add_ptr16_sum265|0;var $23=$fd78;var $24=HEAP32[$23>>2];var $25=$24;var $cmp80=$25>>>0<$1>>>0;if($cmp80){label=26;break}else{label=23;break};case 23:var $bk82=$24+12|0;var $26=HEAP32[$bk82>>2];var $cmp83=($26|0)==($18|0);if($cmp83){label=24;break}else{label=26;break};case 24:var $fd86=$22+8|0;var $27=HEAP32[$fd86>>2];var $cmp87=($27|0)==($18|0);if($cmp87){label=25;break}else{label=26;break};case 25:HEAP32[$bk82>>2]=$22;HEAP32[$fd86>>2]=$24;var $R_1=$22;label=34;break;case 26:_abort();case 27:var $child_sum=$add_ptr_sum231+20|0;var $arrayidx99=$mem+$child_sum|0;var $28=$arrayidx99;var $29=HEAP32[$28>>2];var $cmp100=($29|0)==0;if($cmp100){label=28;break}else{var $R_0=$29;var $RP_0=$28;label=29;break};case 28:var $add_ptr16_sum262=$add_ptr_sum231+16|0;var $child=$mem+$add_ptr16_sum262|0;var $arrayidx103=$child;var $30=HEAP32[$arrayidx103>>2];var $cmp104=($30|0)==0;if($cmp104){var $R_1=0;label=34;break}else{var $R_0=$30;var $RP_0=$arrayidx103;label=29;break};case 29:var $RP_0;var $R_0;var $arrayidx108=$R_0+20|0;var $31=HEAP32[$arrayidx108>>2];var $cmp109=($31|0)==0;if($cmp109){label=30;break}else{var $R_0=$31;var $RP_0=$arrayidx108;label=29;break};case 30:var $arrayidx113=$R_0+16|0;var $32=HEAP32[$arrayidx113>>2];var $cmp114=($32|0)==0;if($cmp114){label=31;break}else{var $R_0=$32;var $RP_0=$arrayidx113;label=29;break};case 31:var $33=$RP_0;var $cmp118=$33>>>0<$1>>>0;if($cmp118){label=33;break}else{label=32;break};case 32:HEAP32[$RP_0>>2]=0;var $R_1=$R_0;label=34;break;case 33:_abort();case 34:var $R_1;var $cmp127=($20|0)==0;if($cmp127){var $p_0=$6;var $psize_0=$add17;label=56;break}else{label=35;break};case 35:var $add_ptr16_sum263=$add_ptr_sum231+28|0;var $index=$mem+$add_ptr16_sum263|0;var $34=$index;var $35=HEAP32[$34>>2];var $arrayidx130=147032+($35<<2)|0;var $36=HEAP32[$arrayidx130>>2];var $cmp131=($18|0)==($36|0);if($cmp131){label=36;break}else{label=38;break};case 36:HEAP32[$arrayidx130>>2]=$R_1;var $cond278=($R_1|0)==0;if($cond278){label=37;break}else{label=44;break};case 37:var $37=HEAP32[$34>>2];var $shl138=1<<$37;var $neg139=~$shl138;var $38=HEAP32[146732>>2];var $and140=$38&$neg139;HEAP32[146732>>2]=$and140;var $p_0=$6;var $psize_0=$add17;label=56;break;case 38:var $39=$20;var $40=HEAP32[146744>>2];var $cmp143=$39>>>0<$40>>>0;if($cmp143){label=42;break}else{label=39;break};case 39:var $arrayidx149=$20+16|0;var $41=HEAP32[$arrayidx149>>2];var $cmp150=($41|0)==($18|0);if($cmp150){label=40;break}else{label=41;break};case 40:HEAP32[$arrayidx149>>2]=$R_1;label=43;break;case 41:var $arrayidx157=$20+20|0;HEAP32[$arrayidx157>>2]=$R_1;label=43;break;case 42:_abort();case 43:var $cmp162=($R_1|0)==0;if($cmp162){var $p_0=$6;var $psize_0=$add17;label=56;break}else{label=44;break};case 44:var $42=$R_1;var $43=HEAP32[146744>>2];var $cmp165=$42>>>0<$43>>>0;if($cmp165){label=53;break}else{label=45;break};case 45:var $parent170=$R_1+24|0;HEAP32[$parent170>>2]=$20;var $add_ptr16_sum264=$add_ptr_sum231+16|0;var $child171=$mem+$add_ptr16_sum264|0;var $arrayidx172=$child171;var $44=HEAP32[$arrayidx172>>2];var $cmp173=($44|0)==0;if($cmp173){label=49;break}else{label=46;break};case 46:var $45=$44;var $46=HEAP32[146744>>2];var $cmp176=$45>>>0<$46>>>0;if($cmp176){label=48;break}else{label=47;break};case 47:var $arrayidx182=$R_1+16|0;HEAP32[$arrayidx182>>2]=$44;var $parent183=$44+24|0;HEAP32[$parent183>>2]=$R_1;label=49;break;case 48:_abort();case 49:var $child171_sum=$add_ptr_sum231+20|0;var $arrayidx188=$mem+$child171_sum|0;var $47=$arrayidx188;var $48=HEAP32[$47>>2];var $cmp189=($48|0)==0;if($cmp189){var $p_0=$6;var $psize_0=$add17;label=56;break}else{label=50;break};case 50:var $49=$48;var $50=HEAP32[146744>>2];var $cmp192=$49>>>0<$50>>>0;if($cmp192){label=52;break}else{label=51;break};case 51:var $arrayidx198=$R_1+20|0;HEAP32[$arrayidx198>>2]=$48;var $parent199=$48+24|0;HEAP32[$parent199>>2]=$R_1;var $p_0=$6;var $psize_0=$add17;label=56;break;case 52:_abort();case 53:_abort();case 54:var $add_ptr6_sum=$and5-4|0;var $head209=$mem+$add_ptr6_sum|0;var $51=$head209;var $52=HEAP32[$51>>2];var $and210=$52&3;var $cmp211=($and210|0)==3;if($cmp211){label=55;break}else{var $p_0=$6;var $psize_0=$add17;label=56;break};case 55:HEAP32[146736>>2]=$add17;var $53=HEAP32[$51>>2];var $and215=$53&-2;HEAP32[$51>>2]=$and215;var $or=$add17|1;var $add_ptr16_sum=$add_ptr_sum231+4|0;var $head216=$mem+$add_ptr16_sum|0;var $54=$head216;HEAP32[$54>>2]=$or;var $prev_foot218=$add_ptr6;HEAP32[$prev_foot218>>2]=$add17;label=140;break;case 56:var $psize_0;var $p_0;var $55=$p_0;var $cmp225=$55>>>0<$add_ptr6>>>0;if($cmp225){label=57;break}else{label=139;break};case 57:var $add_ptr6_sum258=$and5-4|0;var $head228=$mem+$add_ptr6_sum258|0;var $56=$head228;var $57=HEAP32[$56>>2];var $and229=$57&1;var $phitmp=($and229|0)==0;if($phitmp){label=139;break}else{label=58;break};case 58:var $and237=$57&2;var $tobool238=($and237|0)==0;if($tobool238){label=59;break}else{label=112;break};case 59:var $58=HEAP32[146752>>2];var $cmp240=($4|0)==($58|0);if($cmp240){label=60;break}else{label=62;break};case 60:var $59=HEAP32[146740>>2];var $add243=$59+$psize_0|0;HEAP32[146740>>2]=$add243;HEAP32[146752>>2]=$p_0;var $or244=$add243|1;var $head245=$p_0+4|0;HEAP32[$head245>>2]=$or244;var $60=HEAP32[146748>>2];var $cmp246=($p_0|0)==($60|0);if($cmp246){label=61;break}else{label=140;break};case 61:HEAP32[146748>>2]=0;HEAP32[146736>>2]=0;label=140;break;case 62:var $61=HEAP32[146748>>2];var $cmp251=($4|0)==($61|0);if($cmp251){label=63;break}else{label=64;break};case 63:var $62=HEAP32[146736>>2];var $add254=$62+$psize_0|0;HEAP32[146736>>2]=$add254;HEAP32[146748>>2]=$p_0;var $or255=$add254|1;var $head256=$p_0+4|0;HEAP32[$head256>>2]=$or255;var $add_ptr257=$55+$add254|0;var $prev_foot258=$add_ptr257;HEAP32[$prev_foot258>>2]=$add254;label=140;break;case 64:var $and261=$57&-8;var $add262=$and261+$psize_0|0;var $shr263=$57>>>3;var $cmp264=$57>>>0<256;if($cmp264){label=65;break}else{label=77;break};case 65:var $fd268=$mem+$and5|0;var $63=$fd268;var $64=HEAP32[$63>>2];var $add_ptr6_sum252253=$and5|4;var $bk270=$mem+$add_ptr6_sum252253|0;var $65=$bk270;var $66=HEAP32[$65>>2];var $shl273=$shr263<<1;var $arrayidx274=146768+($shl273<<2)|0;var $67=$arrayidx274;var $cmp275=($64|0)==($67|0);if($cmp275){label=68;break}else{label=66;break};case 66:var $68=$64;var $69=HEAP32[146744>>2];var $cmp278=$68>>>0<$69>>>0;if($cmp278){label=76;break}else{label=67;break};case 67:var $bk281=$64+12|0;var $70=HEAP32[$bk281>>2];var $cmp282=($70|0)==($4|0);if($cmp282){label=68;break}else{label=76;break};case 68:var $cmp291=($66|0)==($64|0);if($cmp291){label=69;break}else{label=70;break};case 69:var $shl294=1<<$shr263;var $neg295=~$shl294;var $71=HEAP32[146728>>2];var $and296=$71&$neg295;HEAP32[146728>>2]=$and296;label=110;break;case 70:var $cmp300=($66|0)==($67|0);if($cmp300){label=71;break}else{label=72;break};case 71:var $fd317_pre=$66+8|0;var $fd317_pre_phi=$fd317_pre;label=74;break;case 72:var $72=$66;var $73=HEAP32[146744>>2];var $cmp303=$72>>>0<$73>>>0;if($cmp303){label=75;break}else{label=73;break};case 73:var $fd306=$66+8|0;var $74=HEAP32[$fd306>>2];var $cmp307=($74|0)==($4|0);if($cmp307){var $fd317_pre_phi=$fd306;label=74;break}else{label=75;break};case 74:var $fd317_pre_phi;var $bk316=$64+12|0;HEAP32[$bk316>>2]=$66;HEAP32[$fd317_pre_phi>>2]=$64;label=110;break;case 75:_abort();case 76:_abort();case 77:var $75=$add_ptr6;var $add_ptr6_sum233=$and5+16|0;var $parent326=$mem+$add_ptr6_sum233|0;var $76=$parent326;var $77=HEAP32[$76>>2];var $add_ptr6_sum234235=$and5|4;var $bk328=$mem+$add_ptr6_sum234235|0;var $78=$bk328;var $79=HEAP32[$78>>2];var $cmp329=($79|0)==($75|0);if($cmp329){label=83;break}else{label=78;break};case 78:var $fd333=$mem+$and5|0;var $80=$fd333;var $81=HEAP32[$80>>2];var $82=$81;var $83=HEAP32[146744>>2];var $cmp335=$82>>>0<$83>>>0;if($cmp335){label=82;break}else{label=79;break};case 79:var $bk338=$81+12|0;var $84=HEAP32[$bk338>>2];var $cmp339=($84|0)==($75|0);if($cmp339){label=80;break}else{label=82;break};case 80:var $fd342=$79+8|0;var $85=HEAP32[$fd342>>2];var $cmp343=($85|0)==($75|0);if($cmp343){label=81;break}else{label=82;break};case 81:HEAP32[$bk338>>2]=$79;HEAP32[$fd342>>2]=$81;var $R327_1=$79;label=90;break;case 82:_abort();case 83:var $child356_sum=$and5+12|0;var $arrayidx357=$mem+$child356_sum|0;var $86=$arrayidx357;var $87=HEAP32[$86>>2];var $cmp358=($87|0)==0;if($cmp358){label=84;break}else{var $R327_0=$87;var $RP355_0=$86;label=85;break};case 84:var $add_ptr6_sum236=$and5+8|0;var $child356=$mem+$add_ptr6_sum236|0;var $arrayidx362=$child356;var $88=HEAP32[$arrayidx362>>2];var $cmp363=($88|0)==0;if($cmp363){var $R327_1=0;label=90;break}else{var $R327_0=$88;var $RP355_0=$arrayidx362;label=85;break};case 85:var $RP355_0;var $R327_0;var $arrayidx369=$R327_0+20|0;var $89=HEAP32[$arrayidx369>>2];var $cmp370=($89|0)==0;if($cmp370){label=86;break}else{var $R327_0=$89;var $RP355_0=$arrayidx369;label=85;break};case 86:var $arrayidx374=$R327_0+16|0;var $90=HEAP32[$arrayidx374>>2];var $cmp375=($90|0)==0;if($cmp375){label=87;break}else{var $R327_0=$90;var $RP355_0=$arrayidx374;label=85;break};case 87:var $91=$RP355_0;var $92=HEAP32[146744>>2];var $cmp381=$91>>>0<$92>>>0;if($cmp381){label=89;break}else{label=88;break};case 88:HEAP32[$RP355_0>>2]=0;var $R327_1=$R327_0;label=90;break;case 89:_abort();case 90:var $R327_1;var $cmp390=($77|0)==0;if($cmp390){label=110;break}else{label=91;break};case 91:var $add_ptr6_sum246=$and5+20|0;var $index394=$mem+$add_ptr6_sum246|0;var $93=$index394;var $94=HEAP32[$93>>2];var $arrayidx395=147032+($94<<2)|0;var $95=HEAP32[$arrayidx395>>2];var $cmp396=($75|0)==($95|0);if($cmp396){label=92;break}else{label=94;break};case 92:HEAP32[$arrayidx395>>2]=$R327_1;var $cond279=($R327_1|0)==0;if($cond279){label=93;break}else{label=100;break};case 93:var $96=HEAP32[$93>>2];var $shl403=1<<$96;var $neg404=~$shl403;var $97=HEAP32[146732>>2];var $and405=$97&$neg404;HEAP32[146732>>2]=$and405;label=110;break;case 94:var $98=$77;var $99=HEAP32[146744>>2];var $cmp408=$98>>>0<$99>>>0;if($cmp408){label=98;break}else{label=95;break};case 95:var $arrayidx414=$77+16|0;var $100=HEAP32[$arrayidx414>>2];var $cmp415=($100|0)==($75|0);if($cmp415){label=96;break}else{label=97;break};case 96:HEAP32[$arrayidx414>>2]=$R327_1;label=99;break;case 97:var $arrayidx422=$77+20|0;HEAP32[$arrayidx422>>2]=$R327_1;label=99;break;case 98:_abort();case 99:var $cmp427=($R327_1|0)==0;if($cmp427){label=110;break}else{label=100;break};case 100:var $101=$R327_1;var $102=HEAP32[146744>>2];var $cmp430=$101>>>0<$102>>>0;if($cmp430){label=109;break}else{label=101;break};case 101:var $parent437=$R327_1+24|0;HEAP32[$parent437>>2]=$77;var $add_ptr6_sum247=$and5+8|0;var $child438=$mem+$add_ptr6_sum247|0;var $arrayidx439=$child438;var $103=HEAP32[$arrayidx439>>2];var $cmp440=($103|0)==0;if($cmp440){label=105;break}else{label=102;break};case 102:var $104=$103;var $105=HEAP32[146744>>2];var $cmp443=$104>>>0<$105>>>0;if($cmp443){label=104;break}else{label=103;break};case 103:var $arrayidx449=$R327_1+16|0;HEAP32[$arrayidx449>>2]=$103;var $parent450=$103+24|0;HEAP32[$parent450>>2]=$R327_1;label=105;break;case 104:_abort();case 105:var $child438_sum=$and5+12|0;var $arrayidx455=$mem+$child438_sum|0;var $106=$arrayidx455;var $107=HEAP32[$106>>2];var $cmp456=($107|0)==0;if($cmp456){label=110;break}else{label=106;break};case 106:var $108=$107;var $109=HEAP32[146744>>2];var $cmp459=$108>>>0<$109>>>0;if($cmp459){label=108;break}else{label=107;break};case 107:var $arrayidx465=$R327_1+20|0;HEAP32[$arrayidx465>>2]=$107;var $parent466=$107+24|0;HEAP32[$parent466>>2]=$R327_1;label=110;break;case 108:_abort();case 109:_abort();case 110:var $or475=$add262|1;var $head476=$p_0+4|0;HEAP32[$head476>>2]=$or475;var $add_ptr477=$55+$add262|0;var $prev_foot478=$add_ptr477;HEAP32[$prev_foot478>>2]=$add262;var $110=HEAP32[146748>>2];var $cmp479=($p_0|0)==($110|0);if($cmp479){label=111;break}else{var $psize_1=$add262;label=113;break};case 111:HEAP32[146736>>2]=$add262;label=140;break;case 112:var $and487=$57&-2;HEAP32[$56>>2]=$and487;var $or488=$psize_0|1;var $head489=$p_0+4|0;HEAP32[$head489>>2]=$or488;var $add_ptr490=$55+$psize_0|0;var $prev_foot491=$add_ptr490;HEAP32[$prev_foot491>>2]=$psize_0;var $psize_1=$psize_0;label=113;break;case 113:var $psize_1;var $shr493=$psize_1>>>3;var $cmp494=$psize_1>>>0<256;if($cmp494){label=114;break}else{label=119;break};case 114:var $shl500=$shr493<<1;var $arrayidx501=146768+($shl500<<2)|0;var $111=$arrayidx501;var $112=HEAP32[146728>>2];var $shl503=1<<$shr493;var $and504=$112&$shl503;var $tobool505=($and504|0)==0;if($tobool505){label=115;break}else{label=116;break};case 115:var $or508=$112|$shl503;HEAP32[146728>>2]=$or508;var $arrayidx501_sum_pre=$shl500+2|0;var $_pre=146768+($arrayidx501_sum_pre<<2)|0;var $F502_0=$111;var $_pre_phi=$_pre;label=118;break;case 116:var $arrayidx501_sum245=$shl500+2|0;var $113=146768+($arrayidx501_sum245<<2)|0;var $114=HEAP32[$113>>2];var $115=$114;var $116=HEAP32[146744>>2];var $cmp511=$115>>>0<$116>>>0;if($cmp511){label=117;break}else{var $F502_0=$114;var $_pre_phi=$113;label=118;break};case 117:_abort();case 118:var $_pre_phi;var $F502_0;HEAP32[$_pre_phi>>2]=$p_0;var $bk521=$F502_0+12|0;HEAP32[$bk521>>2]=$p_0;var $fd522=$p_0+8|0;HEAP32[$fd522>>2]=$F502_0;var $bk523=$p_0+12|0;HEAP32[$bk523>>2]=$111;label=140;break;case 119:var $117=$p_0;var $shr527=$psize_1>>>8;var $cmp528=($shr527|0)==0;if($cmp528){var $I526_0=0;label=122;break}else{label=120;break};case 120:var $cmp532=$psize_1>>>0>16777215;if($cmp532){var $I526_0=31;label=122;break}else{label=121;break};case 121:var $sub=$shr527+1048320|0;var $shr536=$sub>>>16;var $and537=$shr536&8;var $shl538=$shr527<<$and537;var $sub539=$shl538+520192|0;var $shr540=$sub539>>>16;var $and541=$shr540&4;var $add542=$and541|$and537;var $shl543=$shl538<<$and541;var $sub544=$shl543+245760|0;var $shr545=$sub544>>>16;var $and546=$shr545&2;var $add547=$add542|$and546;var $sub548=14-$add547|0;var $shl549=$shl543<<$and546;var $shr550=$shl549>>>15;var $add551=$sub548+$shr550|0;var $shl552=$add551<<1;var $add553=$add551+7|0;var $shr554=$psize_1>>>($add553>>>0);var $and555=$shr554&1;var $add556=$and555|$shl552;var $I526_0=$add556;label=122;break;case 122:var $I526_0;var $arrayidx559=147032+($I526_0<<2)|0;var $index560=$p_0+28|0;var $I526_0_c=$I526_0;HEAP32[$index560>>2]=$I526_0_c;var $arrayidx562=$p_0+20|0;HEAP32[$arrayidx562>>2]=0;var $118=$p_0+16|0;HEAP32[$118>>2]=0;var $119=HEAP32[146732>>2];var $shl565=1<<$I526_0;var $and566=$119&$shl565;var $tobool567=($and566|0)==0;if($tobool567){label=123;break}else{label=124;break};case 123:var $or570=$119|$shl565;HEAP32[146732>>2]=$or570;HEAP32[$arrayidx559>>2]=$117;var $parent571=$p_0+24|0;var $_c=$arrayidx559;HEAP32[$parent571>>2]=$_c;var $bk572=$p_0+12|0;HEAP32[$bk572>>2]=$p_0;var $fd573=$p_0+8|0;HEAP32[$fd573>>2]=$p_0;label=136;break;case 124:var $120=HEAP32[$arrayidx559>>2];var $cmp576=($I526_0|0)==31;if($cmp576){var $cond=0;label=126;break}else{label=125;break};case 125:var $shr578=$I526_0>>>1;var $sub581=25-$shr578|0;var $cond=$sub581;label=126;break;case 126:var $cond;var $shl582=$psize_1<<$cond;var $K575_0=$shl582;var $T_0=$120;label=127;break;case 127:var $T_0;var $K575_0;var $head583=$T_0+4|0;var $121=HEAP32[$head583>>2];var $and584=$121&-8;var $cmp585=($and584|0)==($psize_1|0);if($cmp585){label=132;break}else{label=128;break};case 128:var $shr588=$K575_0>>>31;var $arrayidx591=$T_0+16+($shr588<<2)|0;var $122=HEAP32[$arrayidx591>>2];var $cmp593=($122|0)==0;var $shl592=$K575_0<<1;if($cmp593){label=129;break}else{var $K575_0=$shl592;var $T_0=$122;label=127;break};case 129:var $123=$arrayidx591;var $124=HEAP32[146744>>2];var $cmp597=$123>>>0<$124>>>0;if($cmp597){label=131;break}else{label=130;break};case 130:HEAP32[$arrayidx591>>2]=$117;var $parent602=$p_0+24|0;var $T_0_c242=$T_0;HEAP32[$parent602>>2]=$T_0_c242;var $bk603=$p_0+12|0;HEAP32[$bk603>>2]=$p_0;var $fd604=$p_0+8|0;HEAP32[$fd604>>2]=$p_0;label=136;break;case 131:_abort();case 132:var $fd609=$T_0+8|0;var $125=HEAP32[$fd609>>2];var $126=$T_0;var $127=HEAP32[146744>>2];var $cmp610=$126>>>0<$127>>>0;if($cmp610){label=135;break}else{label=133;break};case 133:var $128=$125;var $cmp613=$128>>>0<$127>>>0;if($cmp613){label=135;break}else{label=134;break};case 134:var $bk620=$125+12|0;HEAP32[$bk620>>2]=$117;HEAP32[$fd609>>2]=$117;var $fd622=$p_0+8|0;var $_c241=$125;HEAP32[$fd622>>2]=$_c241;var $bk623=$p_0+12|0;var $T_0_c=$T_0;HEAP32[$bk623>>2]=$T_0_c;var $parent624=$p_0+24|0;HEAP32[$parent624>>2]=0;label=136;break;case 135:_abort();case 136:var $129=HEAP32[146760>>2];var $dec=$129-1|0;HEAP32[146760>>2]=$dec;var $cmp628=($dec|0)==0;if($cmp628){var $sp_0_in_i=147184;label=137;break}else{label=140;break};case 137:var $sp_0_in_i;var $sp_0_i=HEAP32[$sp_0_in_i>>2];var $cmp_i=($sp_0_i|0)==0;var $next4_i=$sp_0_i+8|0;if($cmp_i){label=138;break}else{var $sp_0_in_i=$next4_i;label=137;break};case 138:HEAP32[146760>>2]=-1;label=140;break;case 139:_abort();case 140:return}}function _calloc($n_elements,$elem_size){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($n_elements|0)==0;if($cmp){var $req_0=0;label=4;break}else{label=2;break};case 2:var $mul=Math.imul($elem_size,$n_elements)|0;var $or=$elem_size|$n_elements;var $tobool=$or>>>0>65535;if($tobool){label=3;break}else{var $req_0=$mul;label=4;break};case 3:var $div=($mul>>>0)/($n_elements>>>0)&-1;var $cmp1=($div|0)==($elem_size|0);var $mul_=$cmp1?$mul:-1;var $req_0=$mul_;label=4;break;case 4:var $req_0;var $call=_malloc($req_0);var $cmp4=($call|0)==0;if($cmp4){label=7;break}else{label=5;break};case 5:var $head=$call-4|0;var $0=$head;var $1=HEAP32[$0>>2];var $and6=$1&3;var $cmp7=($and6|0)==0;if($cmp7){label=7;break}else{label=6;break};case 6:_memset($call,0,$req_0);label=7;break;case 7:return $call}}function _realloc($oldmem,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($oldmem|0)==0;if($cmp){label=2;break}else{label=3;break};case 2:var $call=_malloc($bytes);var $mem_0=$call;label=11;break;case 3:var $cmp1=$bytes>>>0>4294967231;if($cmp1){label=4;break}else{label=5;break};case 4:var $call3=___errno_location();HEAP32[$call3>>2]=12;var $mem_0=0;label=11;break;case 5:var $cmp5=$bytes>>>0<11;if($cmp5){var $cond=16;label=7;break}else{label=6;break};case 6:var $add6=$bytes+11|0;var $and=$add6&-8;var $cond=$and;label=7;break;case 7:var $cond;var $add_ptr=$oldmem-8|0;var $0=$add_ptr;var $call7=_try_realloc_chunk($0,$cond);var $cmp8=($call7|0)==0;if($cmp8){label=9;break}else{label=8;break};case 8:var $add_ptr10=$call7+8|0;var $1=$add_ptr10;var $mem_0=$1;label=11;break;case 9:var $call12=_malloc($bytes);var $cmp13=($call12|0)==0;if($cmp13){var $mem_0=0;label=11;break}else{label=10;break};case 10:var $head=$oldmem-4|0;var $2=$head;var $3=HEAP32[$2>>2];var $and15=$3&-8;var $and17=$3&3;var $cmp18=($and17|0)==0;var $cond19=$cmp18?8:4;var $sub=$and15-$cond19|0;var $cmp20=$sub>>>0<$bytes>>>0;var $cond24=$cmp20?$sub:$bytes;_memcpy($call12,$oldmem,$cond24)|0;_free($oldmem);var $mem_0=$call12;label=11;break;case 11:var $mem_0;return $mem_0}}function _try_realloc_chunk($p,$nb){var label=0;label=1;while(1)switch(label){case 1:var $head=$p+4|0;var $0=HEAP32[$head>>2];var $and=$0&-8;var $1=$p;var $add_ptr=$1+$and|0;var $2=$add_ptr;var $3=HEAP32[146744>>2];var $cmp=$1>>>0<$3>>>0;if($cmp){label=72;break}else{label=2;break};case 2:var $and2=$0&3;var $cmp3=($and2|0)!=1;var $cmp5=$1>>>0<$add_ptr>>>0;var $or_cond=$cmp3&$cmp5;if($or_cond){label=3;break}else{label=72;break};case 3:var $add_ptr_sum2122=$and|4;var $head6=$1+$add_ptr_sum2122|0;var $4=$head6;var $5=HEAP32[$4>>2];var $and7=$5&1;var $phitmp=($and7|0)==0;if($phitmp){label=72;break}else{label=4;break};case 4:var $cmp11=($and2|0)==0;if($cmp11){label=5;break}else{label=9;break};case 5:var $cmp_i=$nb>>>0<256;if($cmp_i){var $newp_0=0;label=73;break}else{label=6;break};case 6:var $add_i=$nb+4|0;var $cmp1_i=$and>>>0<$add_i>>>0;if($cmp1_i){label=8;break}else{label=7;break};case 7:var $sub_i=$and-$nb|0;var $6=HEAP32[63160>>2];var $shl_i=$6<<1;var $cmp2_i=$sub_i>>>0>$shl_i>>>0;if($cmp2_i){label=8;break}else{var $newp_0=$p;label=73;break};case 8:var $newp_0=0;label=73;break;case 9:var $cmp13=$and>>>0<$nb>>>0;if($cmp13){label=12;break}else{label=10;break};case 10:var $sub=$and-$nb|0;var $cmp15=$sub>>>0>15;if($cmp15){label=11;break}else{var $newp_0=$p;label=73;break};case 11:var $add_ptr17=$1+$nb|0;var $7=$add_ptr17;var $and19=$0&1;var $or=$and19|$nb;var $or20=$or|2;HEAP32[$head>>2]=$or20;var $add_ptr17_sum=$nb+4|0;var $head23=$1+$add_ptr17_sum|0;var $8=$head23;var $or28=$sub|3;HEAP32[$8>>2]=$or28;var $9=HEAP32[$4>>2];var $or32=$9|1;HEAP32[$4>>2]=$or32;_dispose_chunk($7,$sub);var $newp_0=$p;label=73;break;case 12:var $10=HEAP32[146752>>2];var $cmp34=($2|0)==($10|0);if($cmp34){label=13;break}else{label=15;break};case 13:var $11=HEAP32[146740>>2];var $add=$11+$and|0;var $cmp36=$add>>>0>$nb>>>0;if($cmp36){label=14;break}else{var $newp_0=0;label=73;break};case 14:var $sub40=$add-$nb|0;var $add_ptr41=$1+$nb|0;var $12=$add_ptr41;var $and43=$0&1;var $or44=$and43|$nb;var $or45=$or44|2;HEAP32[$head>>2]=$or45;var $add_ptr41_sum=$nb+4|0;var $head48=$1+$add_ptr41_sum|0;var $13=$head48;var $or50=$sub40|1;HEAP32[$13>>2]=$or50;HEAP32[146752>>2]=$12;HEAP32[146740>>2]=$sub40;var $newp_0=$p;label=73;break;case 15:var $14=HEAP32[146748>>2];var $cmp56=($2|0)==($14|0);if($cmp56){label=16;break}else{label=21;break};case 16:var $15=HEAP32[146736>>2];var $add58=$15+$and|0;var $cmp59=$add58>>>0<$nb>>>0;if($cmp59){var $newp_0=0;label=73;break}else{label=17;break};case 17:var $sub62=$add58-$nb|0;var $cmp63=$sub62>>>0>15;if($cmp63){label=18;break}else{label=19;break};case 18:var $add_ptr66=$1+$nb|0;var $16=$add_ptr66;var $add_ptr67=$1+$add58|0;var $and69=$0&1;var $or70=$and69|$nb;var $or71=$or70|2;HEAP32[$head>>2]=$or71;var $add_ptr66_sum=$nb+4|0;var $head74=$1+$add_ptr66_sum|0;var $17=$head74;var $or76=$sub62|1;HEAP32[$17>>2]=$or76;var $prev_foot=$add_ptr67;HEAP32[$prev_foot>>2]=$sub62;var $add_ptr67_sum=$add58+4|0;var $head79=$1+$add_ptr67_sum|0;var $18=$head79;var $19=HEAP32[$18>>2];var $and80=$19&-2;HEAP32[$18>>2]=$and80;var $storemerge=$16;var $storemerge18=$sub62;label=20;break;case 19:var $and87=$0&1;var $or88=$and87|$add58;var $or89=$or88|2;HEAP32[$head>>2]=$or89;var $add_ptr91_sum=$add58+4|0;var $head92=$1+$add_ptr91_sum|0;var $20=$head92;var $21=HEAP32[$20>>2];var $or93=$21|1;HEAP32[$20>>2]=$or93;var $storemerge=0;var $storemerge18=0;label=20;break;case 20:var $storemerge18;var $storemerge;HEAP32[146736>>2]=$storemerge18;HEAP32[146748>>2]=$storemerge;var $newp_0=$p;label=73;break;case 21:var $and100=$5&2;var $tobool101=($and100|0)==0;if($tobool101){label=22;break}else{var $newp_0=0;label=73;break};case 22:var $and104=$5&-8;var $add105=$and104+$and|0;var $cmp106=$add105>>>0<$nb>>>0;if($cmp106){var $newp_0=0;label=73;break}else{label=23;break};case 23:var $sub110=$add105-$nb|0;var $shr=$5>>>3;var $cmp111=$5>>>0<256;if($cmp111){label=24;break}else{label=36;break};case 24:var $add_ptr_sum12=$and+8|0;var $fd=$1+$add_ptr_sum12|0;var $22=$fd;var $23=HEAP32[$22>>2];var $add_ptr_sum13=$and+12|0;var $bk=$1+$add_ptr_sum13|0;var $24=$bk;var $25=HEAP32[$24>>2];var $shl=$shr<<1;var $arrayidx=146768+($shl<<2)|0;var $26=$arrayidx;var $cmp114=($23|0)==($26|0);if($cmp114){label=27;break}else{label=25;break};case 25:var $27=$23;var $cmp116=$27>>>0<$3>>>0;if($cmp116){label=35;break}else{label=26;break};case 26:var $bk118=$23+12|0;var $28=HEAP32[$bk118>>2];var $cmp119=($28|0)==($2|0);if($cmp119){label=27;break}else{label=35;break};case 27:var $cmp125=($25|0)==($23|0);if($cmp125){label=28;break}else{label=29;break};case 28:var $shl127=1<<$shr;var $neg=~$shl127;var $29=HEAP32[146728>>2];var $and128=$29&$neg;HEAP32[146728>>2]=$and128;label=69;break;case 29:var $cmp133=($25|0)==($26|0);if($cmp133){label=30;break}else{label=31;break};case 30:var $fd148_pre=$25+8|0;var $fd148_pre_phi=$fd148_pre;label=33;break;case 31:var $30=$25;var $cmp136=$30>>>0<$3>>>0;if($cmp136){label=34;break}else{label=32;break};case 32:var $fd138=$25+8|0;var $31=HEAP32[$fd138>>2];var $cmp139=($31|0)==($2|0);if($cmp139){var $fd148_pre_phi=$fd138;label=33;break}else{label=34;break};case 33:var $fd148_pre_phi;var $bk147=$23+12|0;HEAP32[$bk147>>2]=$25;HEAP32[$fd148_pre_phi>>2]=$23;label=69;break;case 34:_abort();case 35:_abort();case 36:var $32=$add_ptr;var $add_ptr_sum=$and+24|0;var $parent=$1+$add_ptr_sum|0;var $33=$parent;var $34=HEAP32[$33>>2];var $add_ptr_sum2=$and+12|0;var $bk155=$1+$add_ptr_sum2|0;var $35=$bk155;var $36=HEAP32[$35>>2];var $cmp156=($36|0)==($32|0);if($cmp156){label=42;break}else{label=37;break};case 37:var $add_ptr_sum9=$and+8|0;var $fd159=$1+$add_ptr_sum9|0;var $37=$fd159;var $38=HEAP32[$37>>2];var $39=$38;var $cmp162=$39>>>0<$3>>>0;if($cmp162){label=41;break}else{label=38;break};case 38:var $bk164=$38+12|0;var $40=HEAP32[$bk164>>2];var $cmp165=($40|0)==($32|0);if($cmp165){label=39;break}else{label=41;break};case 39:var $fd167=$36+8|0;var $41=HEAP32[$fd167>>2];var $cmp168=($41|0)==($32|0);if($cmp168){label=40;break}else{label=41;break};case 40:HEAP32[$bk164>>2]=$36;HEAP32[$fd167>>2]=$38;var $R_1=$36;label=49;break;case 41:_abort();case 42:var $child_sum=$and+20|0;var $arrayidx179=$1+$child_sum|0;var $42=$arrayidx179;var $43=HEAP32[$42>>2];var $cmp180=($43|0)==0;if($cmp180){label=43;break}else{var $R_0=$43;var $RP_0=$42;label=44;break};case 43:var $add_ptr_sum3=$and+16|0;var $child=$1+$add_ptr_sum3|0;var $arrayidx182=$child;var $44=HEAP32[$arrayidx182>>2];var $cmp183=($44|0)==0;if($cmp183){var $R_1=0;label=49;break}else{var $R_0=$44;var $RP_0=$arrayidx182;label=44;break};case 44:var $RP_0;var $R_0;var $arrayidx186=$R_0+20|0;var $45=HEAP32[$arrayidx186>>2];var $cmp187=($45|0)==0;if($cmp187){label=45;break}else{var $R_0=$45;var $RP_0=$arrayidx186;label=44;break};case 45:var $arrayidx190=$R_0+16|0;var $46=HEAP32[$arrayidx190>>2];var $cmp191=($46|0)==0;if($cmp191){label=46;break}else{var $R_0=$46;var $RP_0=$arrayidx190;label=44;break};case 46:var $47=$RP_0;var $cmp195=$47>>>0<$3>>>0;if($cmp195){label=48;break}else{label=47;break};case 47:HEAP32[$RP_0>>2]=0;var $R_1=$R_0;label=49;break;case 48:_abort();case 49:var $R_1;var $cmp203=($34|0)==0;if($cmp203){label=69;break}else{label=50;break};case 50:var $add_ptr_sum7=$and+28|0;var $index=$1+$add_ptr_sum7|0;var $48=$index;var $49=HEAP32[$48>>2];var $arrayidx206=147032+($49<<2)|0;var $50=HEAP32[$arrayidx206>>2];var $cmp207=($32|0)==($50|0);if($cmp207){label=51;break}else{label=53;break};case 51:HEAP32[$arrayidx206>>2]=$R_1;var $cond=($R_1|0)==0;if($cond){label=52;break}else{label=59;break};case 52:var $51=HEAP32[$48>>2];var $shl214=1<<$51;var $neg215=~$shl214;var $52=HEAP32[146732>>2];var $and216=$52&$neg215;HEAP32[146732>>2]=$and216;label=69;break;case 53:var $53=$34;var $54=HEAP32[146744>>2];var $cmp220=$53>>>0<$54>>>0;if($cmp220){label=57;break}else{label=54;break};case 54:var $arrayidx226=$34+16|0;var $55=HEAP32[$arrayidx226>>2];var $cmp227=($55|0)==($32|0);if($cmp227){label=55;break}else{label=56;break};case 55:HEAP32[$arrayidx226>>2]=$R_1;label=58;break;case 56:var $arrayidx234=$34+20|0;HEAP32[$arrayidx234>>2]=$R_1;label=58;break;case 57:_abort();case 58:var $cmp239=($R_1|0)==0;if($cmp239){label=69;break}else{label=59;break};case 59:var $56=$R_1;var $57=HEAP32[146744>>2];var $cmp243=$56>>>0<$57>>>0;if($cmp243){label=68;break}else{label=60;break};case 60:var $parent248=$R_1+24|0;HEAP32[$parent248>>2]=$34;var $add_ptr_sum8=$and+16|0;var $child249=$1+$add_ptr_sum8|0;var $arrayidx250=$child249;var $58=HEAP32[$arrayidx250>>2];var $cmp251=($58|0)==0;if($cmp251){label=64;break}else{label=61;break};case 61:var $59=$58;var $60=HEAP32[146744>>2];var $cmp255=$59>>>0<$60>>>0;if($cmp255){label=63;break}else{label=62;break};case 62:var $arrayidx261=$R_1+16|0;HEAP32[$arrayidx261>>2]=$58;var $parent262=$58+24|0;HEAP32[$parent262>>2]=$R_1;label=64;break;case 63:_abort();case 64:var $child249_sum=$and+20|0;var $arrayidx267=$1+$child249_sum|0;var $61=$arrayidx267;var $62=HEAP32[$61>>2];var $cmp268=($62|0)==0;if($cmp268){label=69;break}else{label=65;break};case 65:var $63=$62;var $64=HEAP32[146744>>2];var $cmp272=$63>>>0<$64>>>0;if($cmp272){label=67;break}else{label=66;break};case 66:var $arrayidx278=$R_1+20|0;HEAP32[$arrayidx278>>2]=$62;var $parent279=$62+24|0;HEAP32[$parent279>>2]=$R_1;label=69;break;case 67:_abort();case 68:_abort();case 69:var $cmp288=$sub110>>>0<16;if($cmp288){label=70;break}else{label=71;break};case 70:var $65=HEAP32[$head>>2];var $and294=$65&1;var $or295=$add105|$and294;var $or296=$or295|2;HEAP32[$head>>2]=$or296;var $add_ptr298_sum6=$add105|4;var $head299=$1+$add_ptr298_sum6|0;var $66=$head299;var $67=HEAP32[$66>>2];var $or300=$67|1;HEAP32[$66>>2]=$or300;var $newp_0=$p;label=73;break;case 71:var $add_ptr303=$1+$nb|0;var $68=$add_ptr303;var $69=HEAP32[$head>>2];var $and305=$69&1;var $or306=$and305|$nb;var $or307=$or306|2;HEAP32[$head>>2]=$or307;var $add_ptr303_sum=$nb+4|0;var $head310=$1+$add_ptr303_sum|0;var $70=$head310;var $or315=$sub110|3;HEAP32[$70>>2]=$or315;var $add_ptr317_sum5=$add105|4;var $head318=$1+$add_ptr317_sum5|0;var $71=$head318;var $72=HEAP32[$71>>2];var $or319=$72|1;HEAP32[$71>>2]=$or319;_dispose_chunk($68,$sub110);var $newp_0=$p;label=73;break;case 72:_abort();case 73:var $newp_0;return $newp_0}}function _realloc_in_place($oldmem,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($oldmem|0)==0;if($cmp){label=7;break}else{label=2;break};case 2:var $cmp1=$bytes>>>0>4294967231;if($cmp1){label=3;break}else{label=4;break};case 3:var $call=___errno_location();HEAP32[$call>>2]=12;label=7;break;case 4:var $cmp3=$bytes>>>0<11;if($cmp3){var $cond=16;label=6;break}else{label=5;break};case 5:var $add4=$bytes+11|0;var $and=$add4&-8;var $cond=$and;label=6;break;case 6:var $cond;var $add_ptr=$oldmem-8|0;var $0=$add_ptr;var $call5=_try_realloc_chunk($0,$cond);var $cmp6=($call5|0)==($0|0);var $oldmem_=$cmp6?$oldmem:0;return $oldmem_;case 7:return 0}}function _memalign($alignment,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $cmp=$alignment>>>0<9;if($cmp){label=2;break}else{label=3;break};case 2:var $call=_malloc($bytes);var $retval_0=$call;label=4;break;case 3:var $call1=_internal_memalign($alignment,$bytes);var $retval_0=$call1;label=4;break;case 4:var $retval_0;return $retval_0}}function _internal_memalign($alignment,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $cmp=$alignment>>>0<16;var $_alignment=$cmp?16:$alignment;var $sub=$_alignment-1|0;var $and=$sub&$_alignment;var $cmp1=($and|0)==0;if($cmp1){var $alignment_addr_1=$_alignment;label=3;break}else{var $a_0=16;label=2;break};case 2:var $a_0;var $cmp3=$a_0>>>0<$_alignment>>>0;var $shl=$a_0<<1;if($cmp3){var $a_0=$shl;label=2;break}else{var $alignment_addr_1=$a_0;label=3;break};case 3:var $alignment_addr_1;var $sub5=-64-$alignment_addr_1|0;var $cmp6=$sub5>>>0>$bytes>>>0;if($cmp6){label=5;break}else{label=4;break};case 4:var $call=___errno_location();HEAP32[$call>>2]=12;var $mem_0=0;label=18;break;case 5:var $cmp11=$bytes>>>0<11;if($cmp11){var $cond=16;label=7;break}else{label=6;break};case 6:var $add12=$bytes+11|0;var $and13=$add12&-8;var $cond=$and13;label=7;break;case 7:var $cond;var $add14=$alignment_addr_1+12|0;var $sub16=$add14+$cond|0;var $call17=_malloc($sub16);var $cmp18=($call17|0)==0;if($cmp18){var $mem_0=0;label=18;break}else{label=8;break};case 8:var $add_ptr=$call17-8|0;var $0=$add_ptr;var $1=$call17;var $sub20=$alignment_addr_1-1|0;var $and21=$1&$sub20;var $cmp22=($and21|0)==0;if($cmp22){var $p_0=$0;label=14;break}else{label=9;break};case 9:var $add_ptr25=$call17+$sub20|0;var $2=$add_ptr25;var $sub26=-$alignment_addr_1|0;var $and27=$2&$sub26;var $3=$and27;var $add_ptr28=$3-8|0;var $sub_ptr_lhs_cast=$add_ptr28;var $sub_ptr_rhs_cast=$add_ptr;var $sub_ptr_sub=$sub_ptr_lhs_cast-$sub_ptr_rhs_cast|0;var $cmp29=$sub_ptr_sub>>>0>15;if($cmp29){var $cond34=$add_ptr28;label=11;break}else{label=10;break};case 10:var $add_ptr28_sum=$alignment_addr_1-8|0;var $add_ptr32=$3+$add_ptr28_sum|0;var $cond34=$add_ptr32;label=11;break;case 11:var $cond34;var $4=$cond34;var $sub_ptr_lhs_cast35=$cond34;var $sub_ptr_sub37=$sub_ptr_lhs_cast35-$sub_ptr_rhs_cast|0;var $head=$call17-4|0;var $5=$head;var $6=HEAP32[$5>>2];var $and38=$6&-8;var $sub39=$and38-$sub_ptr_sub37|0;var $and41=$6&3;var $cmp42=($and41|0)==0;if($cmp42){label=12;break}else{label=13;break};case 12:var $prev_foot=$add_ptr;var $7=HEAP32[$prev_foot>>2];var $add44=$7+$sub_ptr_sub37|0;var $prev_foot45=$cond34;HEAP32[$prev_foot45>>2]=$add44;var $head46=$cond34+4|0;var $8=$head46;HEAP32[$8>>2]=$sub39;var $p_0=$4;label=14;break;case 13:var $head48=$cond34+4|0;var $9=$head48;var $10=HEAP32[$9>>2];var $and49=$10&1;var $or=$sub39|$and49;var $or50=$or|2;HEAP32[$9>>2]=$or50;var $add_ptr52_sum=$sub39+4|0;var $head53=$cond34+$add_ptr52_sum|0;var $11=$head53;var $12=HEAP32[$11>>2];var $or54=$12|1;HEAP32[$11>>2]=$or54;var $13=HEAP32[$5>>2];var $and56=$13&1;var $or57=$sub_ptr_sub37|$and56;var $or58=$or57|2;HEAP32[$5>>2]=$or58;var $add_ptr60_sum=$sub_ptr_sub37-4|0;var $head61=$call17+$add_ptr60_sum|0;var $14=$head61;var $15=HEAP32[$14>>2];var $or62=$15|1;HEAP32[$14>>2]=$or62;_dispose_chunk($0,$sub_ptr_sub37);var $p_0=$4;label=14;break;case 14:var $p_0;var $head65=$p_0+4|0;var $16=HEAP32[$head65>>2];var $and66=$16&3;var $cmp67=($and66|0)==0;if($cmp67){label=17;break}else{label=15;break};case 15:var $and70=$16&-8;var $add71=$cond+16|0;var $cmp72=$and70>>>0>$add71>>>0;if($cmp72){label=16;break}else{label=17;break};case 16:var $sub74=$and70-$cond|0;var $17=$p_0;var $add_ptr75=$17+$cond|0;var $18=$add_ptr75;var $and77=$16&1;var $or78=$cond|$and77;var $or79=$or78|2;HEAP32[$head65>>2]=$or79;var $add_ptr75_sum1=$cond|4;var $head82=$17+$add_ptr75_sum1|0;var $19=$head82;var $or87=$sub74|3;HEAP32[$19>>2]=$or87;var $add_ptr89_sum2=$and70|4;var $head90=$17+$add_ptr89_sum2|0;var $20=$head90;var $21=HEAP32[$20>>2];var $or91=$21|1;HEAP32[$20>>2]=$or91;_dispose_chunk($18,$sub74);label=17;break;case 17:var $add_ptr94=$p_0+8|0;var $22=$add_ptr94;var $mem_0=$22;label=18;break;case 18:var $mem_0;return $mem_0}}function _posix_memalign($pp,$alignment,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($alignment|0)==8;if($cmp){label=2;break}else{label=3;break};case 2:var $call=_malloc($bytes);var $mem_0=$call;label=7;break;case 3:var $div=$alignment>>>2;var $rem=$alignment&3;var $cmp1=($rem|0)!=0;var $cmp2=($div|0)==0;var $or_cond=$cmp1|$cmp2;if($or_cond){var $retval_0=22;label=9;break}else{label=4;break};case 4:var $sub=$div+1073741823|0;var $and=$sub&$div;var $cmp4=($and|0)==0;if($cmp4){label=5;break}else{var $retval_0=22;label=9;break};case 5:var $sub7=-64-$alignment|0;var $cmp8=$sub7>>>0<$bytes>>>0;if($cmp8){var $retval_0=12;label=9;break}else{label=6;break};case 6:var $cmp10=$alignment>>>0<16;var $_alignment=$cmp10?16:$alignment;var $call12=_internal_memalign($_alignment,$bytes);var $mem_0=$call12;label=7;break;case 7:var $mem_0;var $cmp16=($mem_0|0)==0;if($cmp16){var $retval_0=12;label=9;break}else{label=8;break};case 8:HEAP32[$pp>>2]=$mem_0;var $retval_0=0;label=9;break;case 9:var $retval_0;return $retval_0}}function _valloc($bytes){var label=0;label=1;while(1)switch(label){case 1:var $0=HEAP32[63152>>2];var $cmp=($0|0)==0;if($cmp){label=2;break}else{label=5;break};case 2:var $call_i=_sysconf(30);var $sub_i=$call_i-1|0;var $and_i=$sub_i&$call_i;var $cmp1_i=($and_i|0)==0;if($cmp1_i){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[63160>>2]=$call_i;HEAP32[63156>>2]=$call_i;HEAP32[63164>>2]=-1;HEAP32[63168>>2]=-1;HEAP32[63172>>2]=0;HEAP32[147172>>2]=0;var $call6_i=_time(0);var $xor_i=$call6_i&-16;var $and7_i=$xor_i^1431655768;HEAP32[63152>>2]=$and7_i;label=5;break;case 5:var $1=HEAP32[63156>>2];var $call1=_memalign($1,$bytes);return $call1}}function _pvalloc($bytes){var label=0;label=1;while(1)switch(label){case 1:var $0=HEAP32[63152>>2];var $cmp=($0|0)==0;if($cmp){label=2;break}else{label=5;break};case 2:var $call_i=_sysconf(30);var $sub_i=$call_i-1|0;var $and_i=$sub_i&$call_i;var $cmp1_i=($and_i|0)==0;if($cmp1_i){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[63160>>2]=$call_i;HEAP32[63156>>2]=$call_i;HEAP32[63164>>2]=-1;HEAP32[63168>>2]=-1;HEAP32[63172>>2]=0;HEAP32[147172>>2]=0;var $call6_i=_time(0);var $xor_i=$call6_i&-16;var $and7_i=$xor_i^1431655768;HEAP32[63152>>2]=$and7_i;label=5;break;case 5:var $1=HEAP32[63156>>2];var $add=$bytes-1|0;var $sub=$add+$1|0;var $neg=-$1|0;var $and=$sub&$neg;var $call2=_memalign($1,$and);return $call2}}function _independent_calloc($n_elements,$elem_size,$chunks){var sp=STACKTOP;STACKTOP=STACKTOP+8|0;var $sz=sp;HEAP32[$sz>>2]=$elem_size;var $call=_ialloc($n_elements,$sz,3,$chunks);STACKTOP=sp;return $call}function _ialloc($n_elements,$sizes,$opts,$chunks){var label=0;label=1;while(1)switch(label){case 1:var $0=HEAP32[63152>>2];var $cmp=($0|0)==0;if($cmp){label=2;break}else{label=5;break};case 2:var $call_i=_sysconf(30);var $sub_i=$call_i-1|0;var $and_i=$sub_i&$call_i;var $cmp1_i=($and_i|0)==0;if($cmp1_i){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[63160>>2]=$call_i;HEAP32[63156>>2]=$call_i;HEAP32[63164>>2]=-1;HEAP32[63168>>2]=-1;HEAP32[63172>>2]=0;HEAP32[147172>>2]=0;var $call6_i=_time(0);var $xor_i=$call6_i&-16;var $and7_i=$xor_i^1431655768;HEAP32[63152>>2]=$and7_i;label=5;break;case 5:var $cmp1=($chunks|0)==0;var $cmp2=($n_elements|0)==0;if($cmp1){label=7;break}else{label=6;break};case 6:if($cmp2){var $retval_0=$chunks;label=31;break}else{var $marray_0=$chunks;var $array_size_0=0;label=11;break};case 7:if($cmp2){label=8;break}else{label=9;break};case 8:var $call6=_malloc(0);var $1=$call6;var $retval_0=$1;label=31;break;case 9:var $mul=$n_elements<<2;var $cmp8=$mul>>>0<11;if($cmp8){var $marray_0=0;var $array_size_0=16;label=11;break}else{label=10;break};case 10:var $add10=$mul+11|0;var $and=$add10&-8;var $marray_0=0;var $array_size_0=$and;label=11;break;case 11:var $array_size_0;var $marray_0;var $and12=$opts&1;var $tobool13=($and12|0)==0;if($tobool13){label=12;break}else{label=13;break};case 12:if($cmp2){var $element_size_0=0;var $contents_size_1=0;label=19;break}else{var $contents_size_08=0;var $i_09=0;label=16;break};case 13:var $2=HEAP32[$sizes>>2];var $cmp15=$2>>>0<11;if($cmp15){var $cond22=16;label=15;break}else{label=14;break};case 14:var $add19=$2+11|0;var $and20=$add19&-8;var $cond22=$and20;label=15;break;case 15:var $cond22;var $mul23=Math.imul($cond22,$n_elements)|0;var $element_size_0=$cond22;var $contents_size_1=$mul23;label=19;break;case 16:var $i_09;var $contents_size_08;var $arrayidx=$sizes+($i_09<<2)|0;var $3=HEAP32[$arrayidx>>2];var $cmp26=$3>>>0<11;if($cmp26){var $cond34=16;label=18;break}else{label=17;break};case 17:var $add31=$3+11|0;var $and32=$add31&-8;var $cond34=$and32;label=18;break;case 18:var $cond34;var $add35=$cond34+$contents_size_08|0;var $inc=$i_09+1|0;var $cmp25=($inc|0)==($n_elements|0);if($cmp25){var $element_size_0=0;var $contents_size_1=$add35;label=19;break}else{var $contents_size_08=$add35;var $i_09=$inc;label=16;break};case 19:var $contents_size_1;var $element_size_0;var $add37=$array_size_0-4|0;var $sub=$add37+$contents_size_1|0;var $call39=_malloc($sub);var $cmp44=($call39|0)==0;if($cmp44){var $retval_0=0;label=31;break}else{label=20;break};case 20:var $add_ptr=$call39-8|0;var $head=$call39-4|0;var $4=$head;var $5=HEAP32[$4>>2];var $and47=$5&-8;var $and48=$opts&2;var $tobool49=($and48|0)==0;if($tobool49){label=22;break}else{label=21;break};case 21:var $sub51=-4-$array_size_0|0;var $sub52=$sub51+$and47|0;_memset($call39,0,$sub52);label=22;break;case 22:var $cmp54=($marray_0|0)==0;if($cmp54){label=23;break}else{var $marray_1=$marray_0;var $remainder_size_0=$and47;label=24;break};case 23:var $sub57=$and47-$contents_size_1|0;var $add_ptr58=$call39+$contents_size_1|0;var $6=$add_ptr58;var $or59=$sub57|3;var $add_ptr56_sum=$contents_size_1-4|0;var $head60=$call39+$add_ptr56_sum|0;var $7=$head60;HEAP32[$7>>2]=$or59;var $marray_1=$6;var $remainder_size_0=$contents_size_1;label=24;break;case 24:var $remainder_size_0;var $marray_1;HEAP32[$marray_1>>2]=$call39;var $sub65=$n_elements-1|0;var $cmp662=($sub65|0)==0;if($cmp662){var $p_0_in_lcssa=$add_ptr;var $remainder_size_1_lcssa=$remainder_size_0;label=30;break}else{label=25;break};case 25:var $cmp68=($element_size_0|0)==0;if($cmp68){var $p_0_in3_us=$add_ptr;var $remainder_size_14_us=$remainder_size_0;var $i_15_us=0;label=26;break}else{var $p_0_in3=$add_ptr;var $remainder_size_14=$remainder_size_0;var $i_15=0;label=29;break};case 26:var $i_15_us;var $remainder_size_14_us;var $p_0_in3_us;var $arrayidx71_us=$sizes+($i_15_us<<2)|0;var $8=HEAP32[$arrayidx71_us>>2];var $cmp72_us=$8>>>0<11;if($cmp72_us){var $size_0_us=16;label=28;break}else{label=27;break};case 27:var $add77_us=$8+11|0;var $and78_us=$add77_us&-8;var $size_0_us=$and78_us;label=28;break;case 28:var $size_0_us;var $sub82_us=$remainder_size_14_us-$size_0_us|0;var $or84_us=$size_0_us|3;var $head85_us=$p_0_in3_us+4|0;var $9=$head85_us;HEAP32[$9>>2]=$or84_us;var $add_ptr86_us=$p_0_in3_us+$size_0_us|0;var $inc93_us=$i_15_us+1|0;var $add_ptr86_us_sum=$size_0_us+8|0;var $add_ptr63_us=$p_0_in3_us+$add_ptr86_us_sum|0;var $arrayidx64_us=$marray_1+($inc93_us<<2)|0;HEAP32[$arrayidx64_us>>2]=$add_ptr63_us;var $cmp66_us=($inc93_us|0)==($sub65|0);if($cmp66_us){var $p_0_in_lcssa=$add_ptr86_us;var $remainder_size_1_lcssa=$sub82_us;label=30;break}else{var $p_0_in3_us=$add_ptr86_us;var $remainder_size_14_us=$sub82_us;var $i_15_us=$inc93_us;label=26;break};case 29:var $i_15;var $remainder_size_14;var $p_0_in3;var $sub82=$remainder_size_14-$element_size_0|0;var $or84=$element_size_0|3;var $head85=$p_0_in3+4|0;var $10=$head85;HEAP32[$10>>2]=$or84;var $add_ptr86=$p_0_in3+$element_size_0|0;var $inc93=$i_15+1|0;var $add_ptr86_sum=$element_size_0+8|0;var $add_ptr63=$p_0_in3+$add_ptr86_sum|0;var $arrayidx64=$marray_1+($inc93<<2)|0;HEAP32[$arrayidx64>>2]=$add_ptr63;var $cmp66=($inc93|0)==($sub65|0);if($cmp66){var $p_0_in_lcssa=$add_ptr86;var $remainder_size_1_lcssa=$sub82;label=30;break}else{var $p_0_in3=$add_ptr86;var $remainder_size_14=$sub82;var $i_15=$inc93;label=29;break};case 30:var $remainder_size_1_lcssa;var $p_0_in_lcssa;var $or89=$remainder_size_1_lcssa|3;var $head90=$p_0_in_lcssa+4|0;var $11=$head90;HEAP32[$11>>2]=$or89;var $retval_0=$marray_1;label=31;break;case 31:var $retval_0;return $retval_0}}function _independent_comalloc($n_elements,$sizes,$chunks){return _ialloc($n_elements,$sizes,0,$chunks)}function _bulk_free($array,$nelem){var label=0;label=1;while(1)switch(label){case 1:var $arrayidx_i=$array+($nelem<<2)|0;var $cmp6_i=($nelem|0)==0;if($cmp6_i){label=12;break}else{var $a_07_i=$array;label=2;break};case 2:var $a_07_i;var $0=HEAP32[$a_07_i>>2];var $cmp1_i=($0|0)==0;if($cmp1_i){label=3;break}else{label=4;break};case 3:var $incdec_ptr_pre_i=$a_07_i+4|0;var $incdec_ptr_pre_phi_i=$incdec_ptr_pre_i;label=11;break;case 4:var $add_ptr_i=$0-8|0;var $1=$add_ptr_i;var $head_i=$0-4|0;var $2=$head_i;var $3=HEAP32[$2>>2];var $and_i=$3&-8;HEAP32[$a_07_i>>2]=0;var $4=HEAP32[146744>>2];var $cmp2_i=$add_ptr_i>>>0<$4>>>0;if($cmp2_i){label=10;break}else{label=5;break};case 5:var $5=HEAP32[$2>>2];var $and4_i=$5&3;var $cmp5_i=($and4_i|0)==1;if($cmp5_i){label=10;break}else{label=6;break};case 6:var $add_ptr7_i=$a_07_i+4|0;var $and92_i=$5-8|0;var $add_ptr_sum_i=$and92_i&-8;var $cmp11_i=($add_ptr7_i|0)==($arrayidx_i|0);if($cmp11_i){label=9;break}else{label=7;break};case 7:var $6=HEAP32[$add_ptr7_i>>2];var $add_ptr10_sum_i=$add_ptr_sum_i+8|0;var $add_ptr12_i=$0+$add_ptr10_sum_i|0;var $cmp13_i=($6|0)==($add_ptr12_i|0);if($cmp13_i){label=8;break}else{label=9;break};case 8:var $add_ptr10_sum34_i=$add_ptr_sum_i|4;var $head15_i=$0+$add_ptr10_sum34_i|0;var $7=$head15_i;var $8=HEAP32[$7>>2];var $and16_i=$8&-8;var $add_i=$and16_i+$and_i|0;var $and18_i=$5&1;var $or_i=$and18_i|$add_i;var $or19_i=$or_i|2;HEAP32[$2>>2]=$or19_i;var $add_ptr21_sum_i=$add_i-4|0;var $head22_i=$0+$add_ptr21_sum_i|0;var $9=$head22_i;var $10=HEAP32[$9>>2];var $or23_i=$10|1;HEAP32[$9>>2]=$or23_i;HEAP32[$add_ptr7_i>>2]=$0;var $incdec_ptr_pre_phi_i=$add_ptr7_i;label=11;break;case 9:_dispose_chunk($1,$and_i);var $incdec_ptr_pre_phi_i=$add_ptr7_i;label=11;break;case 10:_abort();case 11:var $incdec_ptr_pre_phi_i;var $cmp_i=($incdec_ptr_pre_phi_i|0)==($arrayidx_i|0);if($cmp_i){label=12;break}else{var $a_07_i=$incdec_ptr_pre_phi_i;label=2;break};case 12:return 0}}function _malloc_trim($pad){var label=0;label=1;while(1)switch(label){case 1:var $0=HEAP32[63152>>2];var $cmp=($0|0)==0;if($cmp){label=2;break}else{label=5;break};case 2:var $call_i=_sysconf(30);var $sub_i=$call_i-1|0;var $and_i=$sub_i&$call_i;var $cmp1_i=($and_i|0)==0;if($cmp1_i){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[63160>>2]=$call_i;HEAP32[63156>>2]=$call_i;HEAP32[63164>>2]=-1;HEAP32[63168>>2]=-1;HEAP32[63172>>2]=0;HEAP32[147172>>2]=0;var $call6_i=_time(0);var $xor_i=$call6_i&-16;var $and7_i=$xor_i^1431655768;HEAP32[63152>>2]=$and7_i;label=5;break;case 5:var $cmp1_i2=$pad>>>0<4294967232;if($cmp1_i2){label=6;break}else{var $released_2_i=0;label=21;break};case 6:var $1=HEAP32[146752>>2];var $cmp2_i=($1|0)==0;if($cmp2_i){var $released_2_i=0;label=21;break}else{label=7;break};case 7:var $add_i=$pad+40|0;var $2=HEAP32[146740>>2];var $cmp3_i=$2>>>0>$add_i>>>0;if($cmp3_i){label=8;break}else{label=19;break};case 8:var $3=HEAP32[63160>>2];var $sub6_i=-41-$pad|0;var $sub_i4=$sub6_i+$2|0;var $add7_i=$sub_i4+$3|0;var $div_i=($add7_i>>>0)/($3>>>0)&-1;var $sub8_i=$div_i-1|0;var $mul_i=Math.imul($sub8_i,$3)|0;var $4=$1;var $sp_0_i_i=147176;label=9;break;case 9:var $sp_0_i_i;var $base_i_i=$sp_0_i_i|0;var $5=HEAP32[$base_i_i>>2];var $cmp_i1_i=$5>>>0>$4>>>0;if($cmp_i1_i){label=11;break}else{label=10;break};case 10:var $size_i_i=$sp_0_i_i+4|0;var $6=HEAP32[$size_i_i>>2];var $add_ptr_i_i=$5+$6|0;var $cmp2_i_i=$add_ptr_i_i>>>0>$4>>>0;if($cmp2_i_i){var $retval_0_i_i=$sp_0_i_i;label=12;break}else{label=11;break};case 11:var $next_i_i=$sp_0_i_i+8|0;var $7=HEAP32[$next_i_i>>2];var $cmp3_i_i=($7|0)==0;if($cmp3_i_i){var $retval_0_i_i=0;label=12;break}else{var $sp_0_i_i=$7;label=9;break};case 12:var $retval_0_i_i;var $sflags_i=$retval_0_i_i+12|0;var $8=HEAP32[$sflags_i>>2];var $and_i5=$8&8;var $tobool11_i=($and_i5|0)==0;if($tobool11_i){label=13;break}else{label=19;break};case 13:var $call20_i=_sbrk(0);var $base_i=$retval_0_i_i|0;var $9=HEAP32[$base_i>>2];var $size_i=$retval_0_i_i+4|0;var $10=HEAP32[$size_i>>2];var $add_ptr_i=$9+$10|0;var $cmp21_i=($call20_i|0)==($add_ptr_i|0);if($cmp21_i){label=14;break}else{label=19;break};case 14:var $sub19_i=-2147483648-$3|0;var $cmp17_i=$mul_i>>>0>2147483646;var $sub19_mul_i=$cmp17_i?$sub19_i:$mul_i;var $sub23_i=-$sub19_mul_i|0;var $call24_i=_sbrk($sub23_i);var $call25_i=_sbrk(0);var $cmp26_i=($call24_i|0)!=-1;var $cmp28_i=$call25_i>>>0<$call20_i>>>0;var $or_cond_i=$cmp26_i&$cmp28_i;if($or_cond_i){label=15;break}else{label=19;break};case 15:var $sub_ptr_lhs_cast_i=$call20_i;var $sub_ptr_rhs_cast_i=$call25_i;var $sub_ptr_sub_i=$sub_ptr_lhs_cast_i-$sub_ptr_rhs_cast_i|0;var $cmp34_i=($call20_i|0)==($call25_i|0);if($cmp34_i){label=19;break}else{label=16;break};case 16:var $11=HEAP32[$size_i>>2];var $sub37_i=$11-$sub_ptr_sub_i|0;HEAP32[$size_i>>2]=$sub37_i;var $12=HEAP32[147160>>2];var $sub38_i=$12-$sub_ptr_sub_i|0;HEAP32[147160>>2]=$sub38_i;var $13=HEAP32[146752>>2];var $14=HEAP32[146740>>2];var $sub41_i=$14-$sub_ptr_sub_i|0;var $15=$13;var $add_ptr_i3_i=$13+8|0;var $16=$add_ptr_i3_i;var $and_i4_i=$16&7;var $cmp_i5_i=($and_i4_i|0)==0;if($cmp_i5_i){var $cond_i_i=0;label=18;break}else{label=17;break};case 17:var $17=-$16|0;var $and3_i_i=$17&7;var $cond_i_i=$and3_i_i;label=18;break;case 18:var $cond_i_i;var $add_ptr4_i_i=$15+$cond_i_i|0;var $18=$add_ptr4_i_i;var $sub5_i_i=$sub41_i-$cond_i_i|0;HEAP32[146752>>2]=$18;HEAP32[146740>>2]=$sub5_i_i;var $or_i_i=$sub5_i_i|1;var $add_ptr4_sum_i_i=$cond_i_i+4|0;var $head_i_i=$15+$add_ptr4_sum_i_i|0;var $19=$head_i_i;HEAP32[$19>>2]=$or_i_i;var $add_ptr6_sum_i_i=$sub41_i+4|0;var $head7_i_i=$15+$add_ptr6_sum_i_i|0;var $20=$head7_i_i;HEAP32[$20>>2]=40;var $21=HEAP32[63168>>2];HEAP32[146756>>2]=$21;var $released_2_i=1;label=21;break;case 19:var $22=HEAP32[146740>>2];var $23=HEAP32[146756>>2];var $cmp47_i=$22>>>0>$23>>>0;if($cmp47_i){label=20;break}else{var $released_2_i=0;label=21;break};case 20:HEAP32[146756>>2]=-1;var $released_2_i=0;label=21;break;case 21:var $released_2_i;return $released_2_i}}function _malloc_footprint(){return HEAP32[147160>>2]}function _malloc_max_footprint(){return HEAP32[147164>>2]}function _malloc_footprint_limit(){var $0=HEAP32[147168>>2];return($0|0)==0?-1:$0}function _malloc_set_footprint_limit($bytes){var label=0;label=1;while(1)switch(label){case 1:var $cmp2=($bytes|0)==-1;if($cmp2){var $result_0=0;label=3;break}else{label=2;break};case 2:var $0=HEAP32[63160>>2];var $sub4=$bytes-1|0;var $add5=$sub4+$0|0;var $neg7=-$0|0;var $and8=$add5&$neg7;var $result_0=$and8;label=3;break;case 3:var $result_0;HEAP32[147168>>2]=$result_0;return $result_0}}function _mallinfo($agg_result){var label=0;label=1;while(1)switch(label){case 1:var $0=HEAP32[63152>>2];var $cmp_i=($0|0)==0;if($cmp_i){label=2;break}else{label=5;break};case 2:var $call_i_i=_sysconf(30);var $sub_i_i=$call_i_i-1|0;var $and_i_i=$sub_i_i&$call_i_i;var $cmp1_i_i=($and_i_i|0)==0;if($cmp1_i_i){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[63160>>2]=$call_i_i;HEAP32[63156>>2]=$call_i_i;HEAP32[63164>>2]=-1;HEAP32[63168>>2]=-1;HEAP32[63172>>2]=0;HEAP32[147172>>2]=0;var $call6_i_i=_time(0);var $xor_i_i=$call6_i_i&-16;var $and7_i_i=$xor_i_i^1431655768;HEAP32[63152>>2]=$and7_i_i;label=5;break;case 5:var $1=HEAP32[146752>>2];var $cmp1_i=($1|0)==0;if($cmp1_i){var $nm_sroa_8_0_i=0;var $nm_sroa_0_0_i=0;var $nm_sroa_1_0_i=0;var $nm_sroa_3_0_i=0;var $nm_sroa_4_0_i=0;var $nm_sroa_6_0_i=0;var $nm_sroa_7_0_i=0;label=17;break}else{label=6;break};case 6:var $2=HEAP32[146740>>2];var $add_i=$2+40|0;var $nfree_08_i=1;var $mfree_09_i=$add_i;var $sum_010_i=$add_i;var $s_011_i=147176;label=7;break;case 7:var $s_011_i;var $sum_010_i;var $mfree_09_i;var $nfree_08_i;var $base_i=$s_011_i|0;var $3=HEAP32[$base_i>>2];var $add_ptr_i=$3+8|0;var $4=$add_ptr_i;var $and_i=$4&7;var $cmp4_i=($and_i|0)==0;if($cmp4_i){var $cond_i=0;label=9;break}else{label=8;break};case 8:var $5=-$4|0;var $and8_i=$5&7;var $cond_i=$and8_i;label=9;break;case 9:var $cond_i;var $add_ptr9_i=$3+$cond_i|0;var $size_i=$s_011_i+4|0;var $6=HEAP32[$size_i>>2];var $add_ptr14_i=$3+$6|0;var $nfree_12_i=$nfree_08_i;var $mfree_13_i=$mfree_09_i;var $sum_14_i=$sum_010_i;var $q_0_in5_i=$add_ptr9_i;label=10;break;case 10:var $q_0_in5_i;var $sum_14_i;var $mfree_13_i;var $nfree_12_i;var $q_0_i=$q_0_in5_i;var $cmp15_i=$q_0_in5_i>>>0>=$add_ptr14_i>>>0;var $cmp18_i=($q_0_i|0)==($1|0);var $or_cond_i=$cmp15_i|$cmp18_i;if($or_cond_i){var $nfree_1_lcssa_i=$nfree_12_i;var $mfree_1_lcssa_i=$mfree_13_i;var $sum_1_lcssa_i=$sum_14_i;label=15;break}else{label=11;break};case 11:var $head_i=$q_0_in5_i+4|0;var $7=$head_i;var $8=HEAP32[$7>>2];var $cmp19_i=($8|0)==7;if($cmp19_i){var $nfree_1_lcssa_i=$nfree_12_i;var $mfree_1_lcssa_i=$mfree_13_i;var $sum_1_lcssa_i=$sum_14_i;label=15;break}else{label=12;break};case 12:var $and22_i=$8&-8;var $add23_i=$and22_i+$sum_14_i|0;var $and25_i=$8&3;var $cmp26_i=($and25_i|0)==1;if($cmp26_i){label=13;break}else{var $mfree_2_i=$mfree_13_i;var $nfree_2_i=$nfree_12_i;label=14;break};case 13:var $add28_i=$and22_i+$mfree_13_i|0;var $inc_i=$nfree_12_i+1|0;var $mfree_2_i=$add28_i;var $nfree_2_i=$inc_i;label=14;break;case 14:var $nfree_2_i;var $mfree_2_i;var $add_ptr31_i=$q_0_in5_i+$and22_i|0;var $cmp12_i=$add_ptr31_i>>>0<$3>>>0;if($cmp12_i){var $nfree_1_lcssa_i=$nfree_2_i;var $mfree_1_lcssa_i=$mfree_2_i;var $sum_1_lcssa_i=$add23_i;label=15;break}else{var $nfree_12_i=$nfree_2_i;var $mfree_13_i=$mfree_2_i;var $sum_14_i=$add23_i;var $q_0_in5_i=$add_ptr31_i;label=10;break};case 15:var $sum_1_lcssa_i;var $mfree_1_lcssa_i;var $nfree_1_lcssa_i;var $next_i=$s_011_i+8|0;var $9=HEAP32[$next_i>>2];var $cmp2_i=($9|0)==0;if($cmp2_i){label=16;break}else{var $nfree_08_i=$nfree_1_lcssa_i;var $mfree_09_i=$mfree_1_lcssa_i;var $sum_010_i=$sum_1_lcssa_i;var $s_011_i=$9;label=7;break};case 16:var $10=HEAP32[147160>>2];var $sub33_i=$10-$sum_1_lcssa_i|0;var $11=HEAP32[147164>>2];var $sub35_i=$10-$mfree_1_lcssa_i|0;var $nm_sroa_8_0_i=$2;var $nm_sroa_0_0_i=$sum_1_lcssa_i;var $nm_sroa_1_0_i=$nfree_1_lcssa_i;var $nm_sroa_3_0_i=$sub33_i;var $nm_sroa_4_0_i=$11;var $nm_sroa_6_0_i=$sub35_i;var $nm_sroa_7_0_i=$mfree_1_lcssa_i;label=17;break;case 17:var $nm_sroa_7_0_i;var $nm_sroa_6_0_i;var $nm_sroa_4_0_i;var $nm_sroa_3_0_i;var $nm_sroa_1_0_i;var $nm_sroa_0_0_i;var $nm_sroa_8_0_i;var $nm_sroa_0_0__idx_i=$agg_result|0;HEAP32[$nm_sroa_0_0__idx_i>>2]=$nm_sroa_0_0_i;var $nm_sroa_1_4__idx24_i=$agg_result+4|0;HEAP32[$nm_sroa_1_4__idx24_i>>2]=$nm_sroa_1_0_i;var $nm_sroa_2_8__idx_i=$agg_result+8|0;var $12=$nm_sroa_2_8__idx_i;var $$etemp$0$0=0;var $$etemp$0$1=0;var $st$1$0=$12|0;HEAP32[$st$1$0>>2]=$$etemp$0$0;var $st$2$1=$12+4|0;HEAP32[$st$2$1>>2]=$$etemp$0$1;var $nm_sroa_3_16__idx26_i=$agg_result+16|0;HEAP32[$nm_sroa_3_16__idx26_i>>2]=$nm_sroa_3_0_i;var $nm_sroa_4_20__idx27_i=$agg_result+20|0;HEAP32[$nm_sroa_4_20__idx27_i>>2]=$nm_sroa_4_0_i;var $nm_sroa_5_24__idx28_i=$agg_result+24|0;HEAP32[$nm_sroa_5_24__idx28_i>>2]=0;var $nm_sroa_6_28__idx29_i=$agg_result+28|0;HEAP32[$nm_sroa_6_28__idx29_i>>2]=$nm_sroa_6_0_i;var $nm_sroa_7_32__idx30_i=$agg_result+32|0;HEAP32[$nm_sroa_7_32__idx30_i>>2]=$nm_sroa_7_0_i;var $nm_sroa_8_36__idx31_i=$agg_result+36|0;HEAP32[$nm_sroa_8_36__idx31_i>>2]=$nm_sroa_8_0_i;return}}function _malloc_stats(){var label=0;var tempVarArgs=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $0=HEAP32[63152>>2];var $cmp_i=($0|0)==0;if($cmp_i){label=2;break}else{label=5;break};case 2:var $call_i_i=_sysconf(30);var $sub_i_i=$call_i_i-1|0;var $and_i_i=$sub_i_i&$call_i_i;var $cmp1_i_i=($and_i_i|0)==0;if($cmp1_i_i){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[63160>>2]=$call_i_i;HEAP32[63156>>2]=$call_i_i;HEAP32[63164>>2]=-1;HEAP32[63168>>2]=-1;HEAP32[63172>>2]=0;HEAP32[147172>>2]=0;var $call6_i_i=_time(0);var $xor_i_i=$call6_i_i&-16;var $and7_i_i=$xor_i_i^1431655768;HEAP32[63152>>2]=$and7_i_i;label=5;break;case 5:var $1=HEAP32[146752>>2];var $cmp1_i=($1|0)==0;if($cmp1_i){var $used_3_i=0;var $fp_0_i=0;var $maxfp_0_i=0;label=14;break}else{label=6;break};case 6:var $2=HEAP32[147164>>2];var $3=HEAP32[147160>>2];var $4=HEAP32[146740>>2];var $add_neg_i=$3-40|0;var $sub_i=$add_neg_i-$4|0;var $used_04_i=$sub_i;var $s_05_i=147176;label=7;break;case 7:var $s_05_i;var $used_04_i;var $base_i=$s_05_i|0;var $5=HEAP32[$base_i>>2];var $add_ptr_i=$5+8|0;var $6=$add_ptr_i;var $and_i=$6&7;var $cmp4_i=($and_i|0)==0;if($cmp4_i){var $cond_i=0;label=9;break}else{label=8;break};case 8:var $7=-$6|0;var $and9_i=$7&7;var $cond_i=$and9_i;label=9;break;case 9:var $cond_i;var $add_ptr10_i=$5+$cond_i|0;var $size_i=$s_05_i+4|0;var $8=HEAP32[$size_i>>2];var $add_ptr15_i=$5+$8|0;var $used_12_i=$used_04_i;var $q_0_in3_i=$add_ptr10_i;label=10;break;case 10:var $q_0_in3_i;var $used_12_i;var $q_0_i=$q_0_in3_i;var $cmp16_i=$q_0_in3_i>>>0>=$add_ptr15_i>>>0;var $cmp19_i=($q_0_i|0)==($1|0);var $or_cond_i=$cmp16_i|$cmp19_i;if($or_cond_i){var $used_1_lcssa_i=$used_12_i;label=13;break}else{label=11;break};case 11:var $head_i=$q_0_in3_i+4|0;var $9=$head_i;var $10=HEAP32[$9>>2];var $cmp20_i=($10|0)==7;if($cmp20_i){var $used_1_lcssa_i=$used_12_i;label=13;break}else{label=12;break};case 12:var $and23_i=$10&3;var $cmp24_i=($and23_i|0)==1;var $and27_i=$10&-8;var $sub28_i=$cmp24_i?$and27_i:0;var $used_2_i=$used_12_i-$sub28_i|0;var $add_ptr31_i=$q_0_in3_i+$and27_i|0;var $cmp13_i=$add_ptr31_i>>>0<$5>>>0;if($cmp13_i){var $used_1_lcssa_i=$used_2_i;label=13;break}else{var $used_12_i=$used_2_i;var $q_0_in3_i=$add_ptr31_i;label=10;break};case 13:var $used_1_lcssa_i;var $next_i=$s_05_i+8|0;var $11=HEAP32[$next_i>>2];var $cmp2_i=($11|0)==0;if($cmp2_i){var $used_3_i=$used_1_lcssa_i;var $fp_0_i=$3;var $maxfp_0_i=$2;label=14;break}else{var $used_04_i=$used_1_lcssa_i;var $s_05_i=$11;label=7;break};case 14:var $maxfp_0_i;var $fp_0_i;var $used_3_i;var $12=HEAP32[_stderr>>2];var $call34_i=_fprintf($12,19856,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$maxfp_0_i,tempVarArgs));STACKTOP=tempVarArgs;var $call35_i=_fprintf($12,21960,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$fp_0_i,tempVarArgs));STACKTOP=tempVarArgs;var $call36_i=_fprintf($12,20808,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$used_3_i,tempVarArgs));STACKTOP=tempVarArgs;STACKTOP=sp;return}}function _mallopt($param_number,$value){var label=0;label=1;while(1)switch(label){case 1:var $0=HEAP32[63152>>2];var $cmp_i=($0|0)==0;if($cmp_i){label=2;break}else{label=5;break};case 2:var $call_i_i=_sysconf(30);var $sub_i_i=$call_i_i-1|0;var $and_i_i=$sub_i_i&$call_i_i;var $cmp1_i_i=($and_i_i|0)==0;if($cmp1_i_i){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[63160>>2]=$call_i_i;HEAP32[63156>>2]=$call_i_i;HEAP32[63164>>2]=-1;HEAP32[63168>>2]=-1;HEAP32[63172>>2]=0;HEAP32[147172>>2]=0;var $call6_i_i=_time(0);var $xor_i_i=$call6_i_i&-16;var $and7_i_i=$xor_i_i^1431655768;HEAP32[63152>>2]=$and7_i_i;label=5;break;case 5:if(($param_number|0)==-3){label=10;break}else if(($param_number|0)==-1){label=6;break}else if(($param_number|0)==-2){label=7;break}else{var $retval_0_i=0;label=11;break};case 6:HEAP32[63168>>2]=$value;var $retval_0_i=1;label=11;break;case 7:var $1=HEAP32[63156>>2];var $cmp3_i=$1>>>0>$value>>>0;if($cmp3_i){var $retval_0_i=0;label=11;break}else{label=8;break};case 8:var $sub_i=$value-1|0;var $and_i=$sub_i&$value;var $cmp4_i=($and_i|0)==0;if($cmp4_i){label=9;break}else{var $retval_0_i=0;label=11;break};case 9:HEAP32[63160>>2]=$value;var $retval_0_i=1;label=11;break;case 10:HEAP32[63164>>2]=$value;var $retval_0_i=1;label=11;break;case 11:var $retval_0_i;return $retval_0_i}}function _malloc_usable_size($mem){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($mem|0)==0;if($cmp){var $retval_0=0;label=4;break}else{label=2;break};case 2:var $head=$mem-4|0;var $0=$head;var $1=HEAP32[$0>>2];var $and=$1&3;var $cmp1=($and|0)==1;if($cmp1){var $retval_0=0;label=4;break}else{label=3;break};case 3:var $and4=$1&-8;var $cmp7=($and|0)==0;var $cond=$cmp7?8:4;var $sub=$and4-$cond|0;var $retval_0=$sub;label=4;break;case 4:var $retval_0;return $retval_0}}function _dispose_chunk($p,$psize){var label=0;label=1;while(1)switch(label){case 1:var $0=$p;var $add_ptr=$0+$psize|0;var $1=$add_ptr;var $head=$p+4|0;var $2=HEAP32[$head>>2];var $and=$2&1;var $tobool=($and|0)==0;if($tobool){label=2;break}else{var $p_addr_0=$p;var $psize_addr_0=$psize;label=54;break};case 2:var $prev_foot=$p|0;var $3=HEAP32[$prev_foot>>2];var $and2=$2&3;var $cmp=($and2|0)==0;if($cmp){label=134;break}else{label=3;break};case 3:var $idx_neg=-$3|0;var $add_ptr5=$0+$idx_neg|0;var $4=$add_ptr5;var $add6=$3+$psize|0;var $5=HEAP32[146744>>2];var $cmp7=$add_ptr5>>>0<$5>>>0;if($cmp7){label=53;break}else{label=4;break};case 4:var $6=HEAP32[146748>>2];var $cmp10=($4|0)==($6|0);if($cmp10){label=51;break}else{label=5;break};case 5:var $shr=$3>>>3;var $cmp13=$3>>>0<256;if($cmp13){label=6;break}else{label=18;break};case 6:var $add_ptr5_sum29=8-$3|0;var $fd=$0+$add_ptr5_sum29|0;var $7=$fd;var $8=HEAP32[$7>>2];var $add_ptr5_sum30=12-$3|0;var $bk=$0+$add_ptr5_sum30|0;var $9=$bk;var $10=HEAP32[$9>>2];var $shl=$shr<<1;var $arrayidx=146768+($shl<<2)|0;var $11=$arrayidx;var $cmp17=($8|0)==($11|0);if($cmp17){label=9;break}else{label=7;break};case 7:var $12=$8;var $cmp20=$12>>>0<$5>>>0;if($cmp20){label=17;break}else{label=8;break};case 8:var $bk22=$8+12|0;var $13=HEAP32[$bk22>>2];var $cmp23=($13|0)==($4|0);if($cmp23){label=9;break}else{label=17;break};case 9:var $cmp28=($10|0)==($8|0);if($cmp28){label=10;break}else{label=11;break};case 10:var $shl31=1<<$shr;var $neg=~$shl31;var $14=HEAP32[146728>>2];var $and32=$14&$neg;HEAP32[146728>>2]=$and32;var $p_addr_0=$4;var $psize_addr_0=$add6;label=54;break;case 11:var $cmp36=($10|0)==($11|0);if($cmp36){label=12;break}else{label=13;break};case 12:var $fd53_pre=$10+8|0;var $fd53_pre_phi=$fd53_pre;label=15;break;case 13:var $15=$10;var $cmp40=$15>>>0<$5>>>0;if($cmp40){label=16;break}else{label=14;break};case 14:var $fd43=$10+8|0;var $16=HEAP32[$fd43>>2];var $cmp44=($16|0)==($4|0);if($cmp44){var $fd53_pre_phi=$fd43;label=15;break}else{label=16;break};case 15:var $fd53_pre_phi;var $bk52=$8+12|0;HEAP32[$bk52>>2]=$10;HEAP32[$fd53_pre_phi>>2]=$8;var $p_addr_0=$4;var $psize_addr_0=$add6;label=54;break;case 16:_abort();case 17:_abort();case 18:var $17=$add_ptr5;var $add_ptr5_sum22=24-$3|0;var $parent=$0+$add_ptr5_sum22|0;var $18=$parent;var $19=HEAP32[$18>>2];var $add_ptr5_sum23=12-$3|0;var $bk60=$0+$add_ptr5_sum23|0;var $20=$bk60;var $21=HEAP32[$20>>2];var $cmp61=($21|0)==($17|0);if($cmp61){label=24;break}else{label=19;break};case 19:var $add_ptr5_sum27=8-$3|0;var $fd65=$0+$add_ptr5_sum27|0;var $22=$fd65;var $23=HEAP32[$22>>2];var $24=$23;var $cmp68=$24>>>0<$5>>>0;if($cmp68){label=23;break}else{label=20;break};case 20:var $bk70=$23+12|0;var $25=HEAP32[$bk70>>2];var $cmp71=($25|0)==($17|0);if($cmp71){label=21;break}else{label=23;break};case 21:var $fd74=$21+8|0;var $26=HEAP32[$fd74>>2];var $cmp75=($26|0)==($17|0);if($cmp75){label=22;break}else{label=23;break};case 22:HEAP32[$bk70>>2]=$21;HEAP32[$fd74>>2]=$23;var $R_1=$21;label=31;break;case 23:_abort();case 24:var $add_ptr5_sum24=16-$3|0;var $child_sum=$add_ptr5_sum24+4|0;var $arrayidx86=$0+$child_sum|0;var $27=$arrayidx86;var $28=HEAP32[$27>>2];var $cmp87=($28|0)==0;if($cmp87){label=25;break}else{var $R_0=$28;var $RP_0=$27;label=26;break};case 25:var $child=$0+$add_ptr5_sum24|0;var $arrayidx90=$child;var $29=HEAP32[$arrayidx90>>2];var $cmp91=($29|0)==0;if($cmp91){var $R_1=0;label=31;break}else{var $R_0=$29;var $RP_0=$arrayidx90;label=26;break};case 26:var $RP_0;var $R_0;var $arrayidx95=$R_0+20|0;var $30=HEAP32[$arrayidx95>>2];var $cmp96=($30|0)==0;if($cmp96){label=27;break}else{var $R_0=$30;var $RP_0=$arrayidx95;label=26;break};case 27:var $arrayidx100=$R_0+16|0;var $31=HEAP32[$arrayidx100>>2];var $cmp101=($31|0)==0;if($cmp101){label=28;break}else{var $R_0=$31;var $RP_0=$arrayidx100;label=26;break};case 28:var $32=$RP_0;var $cmp106=$32>>>0<$5>>>0;if($cmp106){label=30;break}else{label=29;break};case 29:HEAP32[$RP_0>>2]=0;var $R_1=$R_0;label=31;break;case 30:_abort();case 31:var $R_1;var $cmp115=($19|0)==0;if($cmp115){var $p_addr_0=$4;var $psize_addr_0=$add6;label=54;break}else{label=32;break};case 32:var $add_ptr5_sum25=28-$3|0;var $index=$0+$add_ptr5_sum25|0;var $33=$index;var $34=HEAP32[$33>>2];var $arrayidx118=147032+($34<<2)|0;var $35=HEAP32[$arrayidx118>>2];var $cmp119=($17|0)==($35|0);if($cmp119){label=33;break}else{label=35;break};case 33:HEAP32[$arrayidx118>>2]=$R_1;var $cond36=($R_1|0)==0;if($cond36){label=34;break}else{label=41;break};case 34:var $36=HEAP32[$33>>2];var $shl126=1<<$36;var $neg127=~$shl126;var $37=HEAP32[146732>>2];var $and128=$37&$neg127;HEAP32[146732>>2]=$and128;var $p_addr_0=$4;var $psize_addr_0=$add6;label=54;break;case 35:var $38=$19;var $39=HEAP32[146744>>2];var $cmp132=$38>>>0<$39>>>0;if($cmp132){label=39;break}else{label=36;break};case 36:var $arrayidx138=$19+16|0;var $40=HEAP32[$arrayidx138>>2];var $cmp139=($40|0)==($17|0);if($cmp139){label=37;break}else{label=38;break};case 37:HEAP32[$arrayidx138>>2]=$R_1;label=40;break;case 38:var $arrayidx146=$19+20|0;HEAP32[$arrayidx146>>2]=$R_1;label=40;break;case 39:_abort();case 40:var $cmp151=($R_1|0)==0;if($cmp151){var $p_addr_0=$4;var $psize_addr_0=$add6;label=54;break}else{label=41;break};case 41:var $41=$R_1;var $42=HEAP32[146744>>2];var $cmp155=$41>>>0<$42>>>0;if($cmp155){label=50;break}else{label=42;break};case 42:var $parent160=$R_1+24|0;HEAP32[$parent160>>2]=$19;var $add_ptr5_sum26=16-$3|0;var $child161=$0+$add_ptr5_sum26|0;var $arrayidx162=$child161;var $43=HEAP32[$arrayidx162>>2];var $cmp163=($43|0)==0;if($cmp163){label=46;break}else{label=43;break};case 43:var $44=$43;var $45=HEAP32[146744>>2];var $cmp167=$44>>>0<$45>>>0;if($cmp167){label=45;break}else{label=44;break};case 44:var $arrayidx173=$R_1+16|0;HEAP32[$arrayidx173>>2]=$43;var $parent174=$43+24|0;HEAP32[$parent174>>2]=$R_1;label=46;break;case 45:_abort();case 46:var $child161_sum=$add_ptr5_sum26+4|0;var $arrayidx179=$0+$child161_sum|0;var $46=$arrayidx179;var $47=HEAP32[$46>>2];var $cmp180=($47|0)==0;if($cmp180){var $p_addr_0=$4;var $psize_addr_0=$add6;label=54;break}else{label=47;break};case 47:var $48=$47;var $49=HEAP32[146744>>2];var $cmp184=$48>>>0<$49>>>0;if($cmp184){label=49;break}else{label=48;break};case 48:var $arrayidx190=$R_1+20|0;HEAP32[$arrayidx190>>2]=$47;var $parent191=$47+24|0;HEAP32[$parent191>>2]=$R_1;var $p_addr_0=$4;var $psize_addr_0=$add6;label=54;break;case 49:_abort();case 50:_abort();case 51:var $add_ptr_sum=$psize+4|0;var $head201=$0+$add_ptr_sum|0;var $50=$head201;var $51=HEAP32[$50>>2];var $and202=$51&3;var $cmp203=($and202|0)==3;if($cmp203){label=52;break}else{var $p_addr_0=$4;var $psize_addr_0=$add6;label=54;break};case 52:HEAP32[146736>>2]=$add6;var $52=HEAP32[$50>>2];var $and207=$52&-2;HEAP32[$50>>2]=$and207;var $or=$add6|1;var $add_ptr5_sum=4-$3|0;var $head208=$0+$add_ptr5_sum|0;var $53=$head208;HEAP32[$53>>2]=$or;var $prev_foot210=$add_ptr;HEAP32[$prev_foot210>>2]=$add6;label=134;break;case 53:_abort();case 54:var $psize_addr_0;var $p_addr_0;var $54=HEAP32[146744>>2];var $cmp217=$add_ptr>>>0<$54>>>0;if($cmp217){label=133;break}else{label=55;break};case 55:var $add_ptr_sum1=$psize+4|0;var $head222=$0+$add_ptr_sum1|0;var $55=$head222;var $56=HEAP32[$55>>2];var $and223=$56&2;var $tobool224=($and223|0)==0;if($tobool224){label=56;break}else{label=109;break};case 56:var $57=HEAP32[146752>>2];var $cmp226=($1|0)==($57|0);if($cmp226){label=57;break}else{label=59;break};case 57:var $58=HEAP32[146740>>2];var $add229=$58+$psize_addr_0|0;HEAP32[146740>>2]=$add229;HEAP32[146752>>2]=$p_addr_0;var $or231=$add229|1;var $head232=$p_addr_0+4|0;HEAP32[$head232>>2]=$or231;var $59=HEAP32[146748>>2];var $cmp234=($p_addr_0|0)==($59|0);if($cmp234){label=58;break}else{label=134;break};case 58:HEAP32[146748>>2]=0;HEAP32[146736>>2]=0;label=134;break;case 59:var $60=HEAP32[146748>>2];var $cmp242=($1|0)==($60|0);if($cmp242){label=60;break}else{label=61;break};case 60:var $61=HEAP32[146736>>2];var $add246=$61+$psize_addr_0|0;HEAP32[146736>>2]=$add246;HEAP32[146748>>2]=$p_addr_0;var $or248=$add246|1;var $head249=$p_addr_0+4|0;HEAP32[$head249>>2]=$or248;var $62=$p_addr_0;var $add_ptr250=$62+$add246|0;var $prev_foot251=$add_ptr250;HEAP32[$prev_foot251>>2]=$add246;label=134;break;case 61:var $and254=$56&-8;var $add255=$and254+$psize_addr_0|0;var $shr256=$56>>>3;var $cmp257=$56>>>0<256;if($cmp257){label=62;break}else{label=74;break};case 62:var $add_ptr_sum17=$psize+8|0;var $fd261=$0+$add_ptr_sum17|0;var $63=$fd261;var $64=HEAP32[$63>>2];var $add_ptr_sum18=$psize+12|0;var $bk263=$0+$add_ptr_sum18|0;var $65=$bk263;var $66=HEAP32[$65>>2];var $shl266=$shr256<<1;var $arrayidx268=146768+($shl266<<2)|0;var $67=$arrayidx268;var $cmp269=($64|0)==($67|0);if($cmp269){label=65;break}else{label=63;break};case 63:var $68=$64;var $cmp273=$68>>>0<$54>>>0;if($cmp273){label=73;break}else{label=64;break};case 64:var $bk276=$64+12|0;var $69=HEAP32[$bk276>>2];var $cmp277=($69|0)==($1|0);if($cmp277){label=65;break}else{label=73;break};case 65:var $cmp286=($66|0)==($64|0);if($cmp286){label=66;break}else{label=67;break};case 66:var $shl289=1<<$shr256;var $neg290=~$shl289;var $70=HEAP32[146728>>2];var $and292=$70&$neg290;HEAP32[146728>>2]=$and292;label=107;break;case 67:var $cmp297=($66|0)==($67|0);if($cmp297){label=68;break}else{label=69;break};case 68:var $fd315_pre=$66+8|0;var $fd315_pre_phi=$fd315_pre;label=71;break;case 69:var $71=$66;var $cmp301=$71>>>0<$54>>>0;if($cmp301){label=72;break}else{label=70;break};case 70:var $fd304=$66+8|0;var $72=HEAP32[$fd304>>2];var $cmp305=($72|0)==($1|0);if($cmp305){var $fd315_pre_phi=$fd304;label=71;break}else{label=72;break};case 71:var $fd315_pre_phi;var $bk314=$64+12|0;HEAP32[$bk314>>2]=$66;HEAP32[$fd315_pre_phi>>2]=$64;label=107;break;case 72:_abort();case 73:_abort();case 74:var $73=$add_ptr;var $add_ptr_sum2=$psize+24|0;var $parent324=$0+$add_ptr_sum2|0;var $74=$parent324;var $75=HEAP32[$74>>2];var $add_ptr_sum3=$psize+12|0;var $bk326=$0+$add_ptr_sum3|0;var $76=$bk326;var $77=HEAP32[$76>>2];var $cmp327=($77|0)==($73|0);if($cmp327){label=80;break}else{label=75;break};case 75:var $add_ptr_sum15=$psize+8|0;var $fd331=$0+$add_ptr_sum15|0;var $78=$fd331;var $79=HEAP32[$78>>2];var $80=$79;var $cmp334=$80>>>0<$54>>>0;if($cmp334){label=79;break}else{label=76;break};case 76:var $bk337=$79+12|0;var $81=HEAP32[$bk337>>2];var $cmp338=($81|0)==($73|0);if($cmp338){label=77;break}else{label=79;break};case 77:var $fd341=$77+8|0;var $82=HEAP32[$fd341>>2];var $cmp342=($82|0)==($73|0);if($cmp342){label=78;break}else{label=79;break};case 78:HEAP32[$bk337>>2]=$77;HEAP32[$fd341>>2]=$79;var $R325_1=$77;label=87;break;case 79:_abort();case 80:var $child355_sum=$psize+20|0;var $arrayidx356=$0+$child355_sum|0;var $83=$arrayidx356;var $84=HEAP32[$83>>2];var $cmp357=($84|0)==0;if($cmp357){label=81;break}else{var $R325_0=$84;var $RP354_0=$83;label=82;break};case 81:var $add_ptr_sum4=$psize+16|0;var $child355=$0+$add_ptr_sum4|0;var $arrayidx361=$child355;var $85=HEAP32[$arrayidx361>>2];var $cmp362=($85|0)==0;if($cmp362){var $R325_1=0;label=87;break}else{var $R325_0=$85;var $RP354_0=$arrayidx361;label=82;break};case 82:var $RP354_0;var $R325_0;var $arrayidx368=$R325_0+20|0;var $86=HEAP32[$arrayidx368>>2];var $cmp369=($86|0)==0;if($cmp369){label=83;break}else{var $R325_0=$86;var $RP354_0=$arrayidx368;label=82;break};case 83:var $arrayidx373=$R325_0+16|0;var $87=HEAP32[$arrayidx373>>2];var $cmp374=($87|0)==0;if($cmp374){label=84;break}else{var $R325_0=$87;var $RP354_0=$arrayidx373;label=82;break};case 84:var $88=$RP354_0;var $cmp381=$88>>>0<$54>>>0;if($cmp381){label=86;break}else{label=85;break};case 85:HEAP32[$RP354_0>>2]=0;var $R325_1=$R325_0;label=87;break;case 86:_abort();case 87:var $R325_1;var $cmp390=($75|0)==0;if($cmp390){label=107;break}else{label=88;break};case 88:var $add_ptr_sum13=$psize+28|0;var $index394=$0+$add_ptr_sum13|0;var $89=$index394;var $90=HEAP32[$89>>2];var $arrayidx396=147032+($90<<2)|0;var $91=HEAP32[$arrayidx396>>2];var $cmp397=($73|0)==($91|0);if($cmp397){label=89;break}else{label=91;break};case 89:HEAP32[$arrayidx396>>2]=$R325_1;var $cond37=($R325_1|0)==0;if($cond37){label=90;break}else{label=97;break};case 90:var $92=HEAP32[$89>>2];var $shl404=1<<$92;var $neg405=~$shl404;var $93=HEAP32[146732>>2];var $and407=$93&$neg405;HEAP32[146732>>2]=$and407;label=107;break;case 91:var $94=$75;var $95=HEAP32[146744>>2];var $cmp411=$94>>>0<$95>>>0;if($cmp411){label=95;break}else{label=92;break};case 92:var $arrayidx417=$75+16|0;var $96=HEAP32[$arrayidx417>>2];var $cmp418=($96|0)==($73|0);if($cmp418){label=93;break}else{label=94;break};case 93:HEAP32[$arrayidx417>>2]=$R325_1;label=96;break;case 94:var $arrayidx425=$75+20|0;HEAP32[$arrayidx425>>2]=$R325_1;label=96;break;case 95:_abort();case 96:var $cmp430=($R325_1|0)==0;if($cmp430){label=107;break}else{label=97;break};case 97:var $97=$R325_1;var $98=HEAP32[146744>>2];var $cmp434=$97>>>0<$98>>>0;if($cmp434){label=106;break}else{label=98;break};case 98:var $parent441=$R325_1+24|0;HEAP32[$parent441>>2]=$75;var $add_ptr_sum14=$psize+16|0;var $child442=$0+$add_ptr_sum14|0;var $arrayidx443=$child442;var $99=HEAP32[$arrayidx443>>2];var $cmp444=($99|0)==0;if($cmp444){label=102;break}else{label=99;break};case 99:var $100=$99;var $101=HEAP32[146744>>2];var $cmp448=$100>>>0<$101>>>0;if($cmp448){label=101;break}else{label=100;break};case 100:var $arrayidx454=$R325_1+16|0;HEAP32[$arrayidx454>>2]=$99;var $parent455=$99+24|0;HEAP32[$parent455>>2]=$R325_1;label=102;break;case 101:_abort();case 102:var $child442_sum=$psize+20|0;var $arrayidx460=$0+$child442_sum|0;var $102=$arrayidx460;var $103=HEAP32[$102>>2];var $cmp461=($103|0)==0;if($cmp461){label=107;break}else{label=103;break};case 103:var $104=$103;var $105=HEAP32[146744>>2];var $cmp465=$104>>>0<$105>>>0;if($cmp465){label=105;break}else{label=104;break};case 104:var $arrayidx471=$R325_1+20|0;HEAP32[$arrayidx471>>2]=$103;var $parent472=$103+24|0;HEAP32[$parent472>>2]=$R325_1;label=107;break;case 105:_abort();case 106:_abort();case 107:var $or481=$add255|1;var $head482=$p_addr_0+4|0;HEAP32[$head482>>2]=$or481;var $106=$p_addr_0;var $add_ptr483=$106+$add255|0;var $prev_foot484=$add_ptr483;HEAP32[$prev_foot484>>2]=$add255;var $107=HEAP32[146748>>2];var $cmp486=($p_addr_0|0)==($107|0);if($cmp486){label=108;break}else{var $psize_addr_1=$add255;label=110;break};case 108:HEAP32[146736>>2]=$add255;label=134;break;case 109:var $and495=$56&-2;HEAP32[$55>>2]=$and495;var $or496=$psize_addr_0|1;var $head497=$p_addr_0+4|0;HEAP32[$head497>>2]=$or496;var $108=$p_addr_0;var $add_ptr498=$108+$psize_addr_0|0;var $prev_foot499=$add_ptr498;HEAP32[$prev_foot499>>2]=$psize_addr_0;var $psize_addr_1=$psize_addr_0;label=110;break;case 110:var $psize_addr_1;var $shr501=$psize_addr_1>>>3;var $cmp502=$psize_addr_1>>>0<256;if($cmp502){label=111;break}else{label=116;break};case 111:var $shl508=$shr501<<1;var $arrayidx510=146768+($shl508<<2)|0;var $109=$arrayidx510;var $110=HEAP32[146728>>2];var $shl513=1<<$shr501;var $and514=$110&$shl513;var $tobool515=($and514|0)==0;if($tobool515){label=112;break}else{label=113;break};case 112:var $or519=$110|$shl513;HEAP32[146728>>2]=$or519;var $arrayidx510_sum_pre=$shl508+2|0;var $_pre=146768+($arrayidx510_sum_pre<<2)|0;var $F511_0=$109;var $_pre_phi=$_pre;label=115;break;case 113:var $arrayidx510_sum12=$shl508+2|0;var $111=146768+($arrayidx510_sum12<<2)|0;var $112=HEAP32[$111>>2];var $113=$112;var $114=HEAP32[146744>>2];var $cmp523=$113>>>0<$114>>>0;if($cmp523){label=114;break}else{var $F511_0=$112;var $_pre_phi=$111;label=115;break};case 114:_abort();case 115:var $_pre_phi;var $F511_0;HEAP32[$_pre_phi>>2]=$p_addr_0;var $bk533=$F511_0+12|0;HEAP32[$bk533>>2]=$p_addr_0;var $fd534=$p_addr_0+8|0;HEAP32[$fd534>>2]=$F511_0;var $bk535=$p_addr_0+12|0;HEAP32[$bk535>>2]=$109;label=134;break;case 116:var $115=$p_addr_0;var $shr540=$psize_addr_1>>>8;var $cmp541=($shr540|0)==0;if($cmp541){var $I539_0=0;label=119;break}else{label=117;break};case 117:var $cmp545=$psize_addr_1>>>0>16777215;if($cmp545){var $I539_0=31;label=119;break}else{label=118;break};case 118:var $sub=$shr540+1048320|0;var $shr549=$sub>>>16;var $and550=$shr549&8;var $shl551=$shr540<<$and550;var $sub552=$shl551+520192|0;var $shr553=$sub552>>>16;var $and554=$shr553&4;var $add555=$and554|$and550;var $shl556=$shl551<<$and554;var $sub557=$shl556+245760|0;var $shr558=$sub557>>>16;var $and559=$shr558&2;var $add560=$add555|$and559;var $sub561=14-$add560|0;var $shl562=$shl556<<$and559;var $shr563=$shl562>>>15;var $add564=$sub561+$shr563|0;var $shl565=$add564<<1;var $add566=$add564+7|0;var $shr567=$psize_addr_1>>>($add566>>>0);var $and568=$shr567&1;var $add569=$and568|$shl565;var $I539_0=$add569;label=119;break;case 119:var $I539_0;var $arrayidx573=147032+($I539_0<<2)|0;var $index574=$p_addr_0+28|0;var $I539_0_c=$I539_0;HEAP32[$index574>>2]=$I539_0_c;var $arrayidx576=$p_addr_0+20|0;HEAP32[$arrayidx576>>2]=0;var $116=$p_addr_0+16|0;HEAP32[$116>>2]=0;var $117=HEAP32[146732>>2];var $shl580=1<<$I539_0;var $and581=$117&$shl580;var $tobool582=($and581|0)==0;if($tobool582){label=120;break}else{label=121;break};case 120:var $or586=$117|$shl580;HEAP32[146732>>2]=$or586;HEAP32[$arrayidx573>>2]=$115;var $parent587=$p_addr_0+24|0;var $_c=$arrayidx573;HEAP32[$parent587>>2]=$_c;var $bk588=$p_addr_0+12|0;HEAP32[$bk588>>2]=$p_addr_0;var $fd589=$p_addr_0+8|0;HEAP32[$fd589>>2]=$p_addr_0;label=134;break;case 121:var $118=HEAP32[$arrayidx573>>2];var $cmp592=($I539_0|0)==31;if($cmp592){var $cond=0;label=123;break}else{label=122;break};case 122:var $shr594=$I539_0>>>1;var $sub597=25-$shr594|0;var $cond=$sub597;label=123;break;case 123:var $cond;var $shl598=$psize_addr_1<<$cond;var $K591_0=$shl598;var $T_0=$118;label=124;break;case 124:var $T_0;var $K591_0;var $head599=$T_0+4|0;var $119=HEAP32[$head599>>2];var $and600=$119&-8;var $cmp601=($and600|0)==($psize_addr_1|0);if($cmp601){label=129;break}else{label=125;break};case 125:var $shr604=$K591_0>>>31;var $arrayidx607=$T_0+16+($shr604<<2)|0;var $120=HEAP32[$arrayidx607>>2];var $cmp609=($120|0)==0;var $shl608=$K591_0<<1;if($cmp609){label=126;break}else{var $K591_0=$shl608;var $T_0=$120;label=124;break};case 126:var $121=$arrayidx607;var $122=HEAP32[146744>>2];var $cmp614=$121>>>0<$122>>>0;if($cmp614){label=128;break}else{label=127;break};case 127:HEAP32[$arrayidx607>>2]=$115;var $parent619=$p_addr_0+24|0;var $T_0_c9=$T_0;HEAP32[$parent619>>2]=$T_0_c9;var $bk620=$p_addr_0+12|0;HEAP32[$bk620>>2]=$p_addr_0;var $fd621=$p_addr_0+8|0;HEAP32[$fd621>>2]=$p_addr_0;label=134;break;case 128:_abort();case 129:var $fd626=$T_0+8|0;var $123=HEAP32[$fd626>>2];var $124=$T_0;var $125=HEAP32[146744>>2];var $cmp628=$124>>>0<$125>>>0;if($cmp628){label=132;break}else{label=130;break};case 130:var $126=$123;var $cmp632=$126>>>0<$125>>>0;if($cmp632){label=132;break}else{label=131;break};case 131:var $bk639=$123+12|0;HEAP32[$bk639>>2]=$115;HEAP32[$fd626>>2]=$115;var $fd641=$p_addr_0+8|0;var $_c8=$123;HEAP32[$fd641>>2]=$_c8;var $bk642=$p_addr_0+12|0;var $T_0_c=$T_0;HEAP32[$bk642>>2]=$T_0_c;var $parent643=$p_addr_0+24|0;HEAP32[$parent643>>2]=0;label=134;break;case 132:_abort();case 133:_abort();case 134:return}}function __Znwj($size){var label=0;label=1;while(1)switch(label){case 1:var $cmp=($size|0)==0;var $_size=$cmp?1:$size;label=2;break;case 2:var $call=_malloc($_size);var $cmp1=($call|0)==0;if($cmp1){label=3;break}else{label=10;break};case 3:var $0=(tempValue=HEAP32[147208>>2],HEAP32[147208>>2]=tempValue+0,tempValue);var $tobool=($0|0)==0;if($tobool){label=9;break}else{label=4;break};case 4:var $1=$0;FUNCTION_TABLE[$1]();label=2;break;case 5:var $lpad_loopexit4$0=0;$lpad_loopexit4$1=0;var $lpad_phi$1=$lpad_loopexit4$1;var $lpad_phi$0=$lpad_loopexit4$0;label=7;break;case 6:var $lpad_nonloopexit5$0=0;$lpad_nonloopexit5$1=0;var $lpad_phi$1=$lpad_nonloopexit5$1;var $lpad_phi$0=$lpad_nonloopexit5$0;label=7;break;case 7:var $lpad_phi$0;var $lpad_phi$1;var $2=$lpad_phi$1;var $ehspec_fails=($2|0)<0;if($ehspec_fails){label=8;break}else{label=11;break};case 8:var $3=$lpad_phi$0;___cxa_call_unexpected($3);case 9:var $exception=___cxa_allocate_exception(4);var $4=$exception;HEAP32[$4>>2]=23072;___cxa_throw($exception,23200,38);label=12;break;case 10:return $call;case 11:abort();case 12:}}function __ZSt15get_new_handlerv(){return tempValue=HEAP32[147208>>2],HEAP32[147208>>2]=tempValue+0,tempValue}function __ZnwjRKSt9nothrow_t($size,$0){var label=0;label=1;while(1)switch(label){case 1:var $call=__Znwj($size);var $p_0=$call;label=3;break;case 2:var $1$0=0;$1$1=0;var $2=$1$0;var $3=___cxa_begin_catch($2);___cxa_end_catch();var $p_0=0;label=3;break;case 3:var $p_0;return $p_0;case 4:var $4$0=0;$4$1=0;var $5=$4$0;___cxa_call_unexpected($5)}}function __Znaj($size){var label=0;label=1;while(1)switch(label){case 1:var $call=__Znwj($size);label=2;break;case 2:return $call;case 3:var $0$0=0;$0$1=0;var $1=$0$1;var $ehspec_fails=($1|0)<0;if($ehspec_fails){label=4;break}else{label=5;break};case 4:var $2=$0$0;___cxa_call_unexpected($2);case 5:abort()}}function __ZnajRKSt9nothrow_t($size,$0){var label=0;label=1;while(1)switch(label){case 1:var $call=__Znaj($size);var $p_0=$call;label=3;break;case 2:var $1$0=0;$1$1=0;var $2=$1$0;var $3=___cxa_begin_catch($2);___cxa_end_catch();var $p_0=0;label=3;break;case 3:var $p_0;return $p_0;case 4:var $4$0=0;$4$1=0;var $5=$4$0;___cxa_call_unexpected($5)}}function __ZdlPv($ptr){var label=0;label=1;while(1)switch(label){case 1:var $tobool=($ptr|0)==0;if($tobool){label=3;break}else{label=2;break};case 2:_free($ptr);label=3;break;case 3:return}}function __ZdlPvRKSt9nothrow_t($ptr,$0){__ZdlPv($ptr);return}function __ZdaPv($ptr){__ZdlPv($ptr);return}function __ZdaPvRKSt9nothrow_t($ptr,$0){__ZdaPv($ptr);return}function __ZSt15set_new_handlerPFvvE($handler){return tempValue=HEAP32[147208>>2],HEAP32[147208>>2]=$handler,tempValue}function __ZNSt9bad_allocC2Ev($this){HEAP32[$this>>2]=23072;return}function __ZNSt9bad_allocD0Ev($this){__ZdlPv($this);return}function __ZNSt9bad_allocD2Ev($this){return}function __ZNKSt9bad_alloc4whatEv($this){return 20400}function __ZNSt20bad_array_new_lengthC2Ev($this){HEAP32[$this>>2]=23104;return}function __ZNSt20bad_array_new_lengthD0Ev($this){__ZdlPv($this);return}function __ZNKSt20bad_array_new_length4whatEv($this){return 22008}function __ZSt17__throw_bad_allocv(){var $exception=___cxa_allocate_exception(4);HEAP32[$exception>>2]=23072;___cxa_throw($exception,23200,38)}function _getopt($nargc,$nargv,$options){return _getopt_internal($nargc,$nargv,$options,0,0,0)}function _getopt_internal($nargc,$nargv,$options,$long_options,$idx,$flags){var label=0;var tempVarArgs=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $cmp=($options|0)==0;if($cmp){var $retval_0=-1;label=106;break}else{label=2;break};case 2:var $0=HEAP32[10080>>2];var $cmp1=($0|0)==0;if($cmp1){label=3;break}else{label=4;break};case 3:HEAP32[63136>>2]=1;HEAP32[10080>>2]=1;var $3=1;var $2=1;label=5;break;case 4:var $_pre137=HEAP32[63136>>2];var $1=HEAP32[13e3>>2];var $cmp4=($1|0)==-1;var $tobool=($_pre137|0)!=0;var $or_cond=$cmp4|$tobool;if($or_cond){var $3=$_pre137;var $2=$0;label=5;break}else{var $6=$1;var $5=$_pre137;var $4=$0;label=6;break};case 5:var $2;var $3;var $call=_getenv(19440);var $cmp6=($call|0)!=0;var $conv=$cmp6&1;HEAP32[13e3>>2]=$conv;var $6=$conv;var $5=$3;var $4=$2;label=6;break;case 6:var $4;var $5;var $6;var $7=HEAP8[$options];var $cmp9=$7<<24>>24==45;if($cmp9){label=7;break}else{label=8;break};case 7:var $or=$flags|2;var $flags_addr_0146=$or;label=9;break;case 8:var $tobool12=($6|0)!=0;var $cmp15=$7<<24>>24==43;var $or_cond54=$tobool12|$cmp15;var $and=$flags&-2;var $and_flags=$or_cond54?$and:$flags;var $cond153=$7<<24>>24==43;if($cond153){var $flags_addr_0146=$and_flags;label=9;break}else{var $options_addr_0=$options;var $flags_addr_0147=$and_flags;label=10;break};case 9:var $flags_addr_0146;var $incdec_ptr=$options+1|0;var $options_addr_0=$incdec_ptr;var $flags_addr_0147=$flags_addr_0146;label=10;break;case 10:var $flags_addr_0147;var $options_addr_0;HEAP32[63144>>2]=0;var $tobool29=($5|0)==0;if($tobool29){var $9=$4;label=13;break}else{label=11;break};case 11:HEAP32[10528>>2]=-1;HEAP32[10520>>2]=-1;var $8=$4;var $_pr=$5;label=12;break;case 12:var $_pr;var $8;var $phitmp=($_pr|0)==0;if($phitmp){var $9=$8;label=13;break}else{var $12=$8;label=14;break};case 13:var $9;var $10=HEAP32[9800>>2];var $11=HEAP8[$10];var $tobool34=$11<<24>>24==0;if($tobool34){var $12=$9;label=14;break}else{var $47=$10;var $46=$9;label=63;break};case 14:var $12;HEAP32[63136>>2]=0;var $cmp36=($12|0)<($nargc|0);if($cmp36){label=28;break}else{label=15;break};case 15:HEAP32[9800>>2]=146720;var $13=HEAP32[10528>>2];var $cmp39=($13|0)==-1;var $14=HEAP32[10520>>2];if($cmp39){label=25;break}else{label=16;break};case 16:var $sub_i=$13-$14|0;var $sub1_i=$12-$13|0;var $rem_i_i=($sub_i|0)%($sub1_i|0)&-1;var $cmp5_i_i=($rem_i_i|0)==0;if($cmp5_i_i){var $b_addr_0_lcssa_i_i=$sub1_i;label=18;break}else{var $b_addr_06_i_i=$sub1_i;var $c_07_i_i=$rem_i_i;label=17;break};case 17:var $c_07_i_i;var $b_addr_06_i_i;var $rem1_i_i=($b_addr_06_i_i|0)%($c_07_i_i|0)&-1;var $cmp_i_i=($rem1_i_i|0)==0;if($cmp_i_i){var $b_addr_0_lcssa_i_i=$c_07_i_i;label=18;break}else{var $b_addr_06_i_i=$c_07_i_i;var $c_07_i_i=$rem1_i_i;label=17;break};case 18:var $b_addr_0_lcssa_i_i;var $sub2_i=$12-$14|0;var $div_i=($sub2_i|0)/($b_addr_0_lcssa_i_i|0)&-1;var $cmp24_i=($b_addr_0_lcssa_i_i|0)>0;if($cmp24_i){label=19;break}else{var $20=$13;var $19=$14;var $18=$12;label=24;break};case 19:var $cmp421_i=($div_i|0)>0;var $15=-$sub_i|0;if($cmp421_i){var $i_025_us_i=0;label=22;break}else{var $20=$13;var $19=$14;var $18=$12;label=24;break};case 20:var $inc13_us_i=$i_025_us_i+1|0;var $cmp_us_i=($inc13_us_i|0)<($b_addr_0_lcssa_i_i|0);if($cmp_us_i){var $i_025_us_i=$inc13_us_i;label=22;break}else{label=23;break};case 21:var $16;var $pos_023_us_i;var $j_022_us_i;var $cmp6_us_i=($pos_023_us_i|0)<($13|0);var $pos_1_p_us_i=$cmp6_us_i?$sub1_i:$15;var $pos_1_us_i=$pos_1_p_us_i+$pos_023_us_i|0;var $arrayidx_us_i=$nargv+($pos_1_us_i<<2)|0;var $17=HEAP32[$arrayidx_us_i>>2];HEAP32[$arrayidx_us_i>>2]=$16;HEAP32[$arrayidx9_us_i>>2]=$17;var $inc_us_i=$j_022_us_i+1|0;var $cmp4_us_i=($inc_us_i|0)<($div_i|0);if($cmp4_us_i){var $j_022_us_i=$inc_us_i;var $pos_023_us_i=$pos_1_us_i;var $16=$17;label=21;break}else{label=20;break};case 22:var $i_025_us_i;var $add_us_i=$i_025_us_i+$13|0;var $arrayidx9_us_i=$nargv+($add_us_i<<2)|0;var $_pre_i=HEAP32[$arrayidx9_us_i>>2];var $j_022_us_i=0;var $pos_023_us_i=$add_us_i;var $16=$_pre_i;label=21;break;case 23:var $_pre133=HEAP32[10528>>2];var $_pre134=HEAP32[10520>>2];var $_pre135=HEAP32[10080>>2];var $20=$_pre133;var $19=$_pre134;var $18=$_pre135;label=24;break;case 24:var $18;var $19;var $20;var $sub53=$19-$20|0;var $sub42=$sub53+$18|0;HEAP32[10080>>2]=$sub42;label=27;break;case 25:var $cmp44=($14|0)==-1;if($cmp44){label=27;break}else{label=26;break};case 26:HEAP32[10080>>2]=$14;label=27;break;case 27:HEAP32[10528>>2]=-1;HEAP32[10520>>2]=-1;var $retval_0=-1;label=106;break;case 28:var $arrayidx=$nargv+($12<<2)|0;var $21=HEAP32[$arrayidx>>2];HEAP32[9800>>2]=$21;var $22=HEAP8[$21];var $cmp51=$22<<24>>24==45;if($cmp51){label=29;break}else{label=31;break};case 29:var $arrayidx54=$21+1|0;var $23=HEAP8[$arrayidx54];var $cmp56=$23<<24>>24==0;if($cmp56){label=30;break}else{label=47;break};case 30:var $call58=_strchr($options_addr_0,45);var $cmp59=($call58|0)==0;if($cmp59){label=31;break}else{label=47;break};case 31:HEAP32[9800>>2]=146720;var $and62=$flags_addr_0147&2;var $tobool63=($and62|0)==0;if($tobool63){label=33;break}else{label=32;break};case 32:var $inc=$12+1|0;HEAP32[10080>>2]=$inc;var $24=HEAP32[$arrayidx>>2];HEAP32[63144>>2]=$24;var $retval_0=1;label=106;break;case 33:var $and67=$flags_addr_0147&1;var $tobool68=($and67|0)==0;if($tobool68){var $retval_0=-1;label=106;break}else{label=34;break};case 34:var $25=HEAP32[10520>>2];var $cmp71=($25|0)==-1;if($cmp71){label=35;break}else{label=36;break};case 35:HEAP32[10520>>2]=$12;var $33=$12;var $_pr_pre=0;label=46;break;case 36:var $26=HEAP32[10528>>2];var $cmp75=($26|0)==-1;if($cmp75){var $33=$12;var $_pr_pre=0;label=46;break}else{label=37;break};case 37:var $sub_i56=$26-$25|0;var $sub1_i57=$12-$26|0;var $rem_i_i58=($sub_i56|0)%($sub1_i57|0)&-1;var $cmp5_i_i59=($rem_i_i58|0)==0;if($cmp5_i_i59){var $b_addr_0_lcssa_i_i65=$sub1_i57;label=39;break}else{var $b_addr_06_i_i61=$sub1_i57;var $c_07_i_i60=$rem_i_i58;label=38;break};case 38:var $c_07_i_i60;var $b_addr_06_i_i61;var $rem1_i_i62=($b_addr_06_i_i61|0)%($c_07_i_i60|0)&-1;var $cmp_i_i63=($rem1_i_i62|0)==0;if($cmp_i_i63){var $b_addr_0_lcssa_i_i65=$c_07_i_i60;label=39;break}else{var $b_addr_06_i_i61=$c_07_i_i60;var $c_07_i_i60=$rem1_i_i62;label=38;break};case 39:var $b_addr_0_lcssa_i_i65;var $sub2_i66=$12-$25|0;var $div_i67=($sub2_i66|0)/($b_addr_0_lcssa_i_i65|0)&-1;var $cmp24_i68=($b_addr_0_lcssa_i_i65|0)>0;if($cmp24_i68){label=40;break}else{var $32=$12;var $31=$26;var $30=$25;var $_pr_pre_pre=0;label=45;break};case 40:var $cmp421_i70=($div_i67|0)>0;var $27=-$sub_i56|0;if($cmp421_i70){var $i_025_us_i84=0;label=43;break}else{var $32=$12;var $31=$26;var $30=$25;var $_pr_pre_pre=0;label=45;break};case 41:var $inc13_us_i72=$i_025_us_i84+1|0;var $cmp_us_i73=($inc13_us_i72|0)<($b_addr_0_lcssa_i_i65|0);if($cmp_us_i73){var $i_025_us_i84=$inc13_us_i72;label=43;break}else{label=44;break};case 42:var $28;var $pos_023_us_i75;var $j_022_us_i76;var $cmp6_us_i77=($pos_023_us_i75|0)<($26|0);var $pos_1_p_us_i78=$cmp6_us_i77?$sub1_i57:$27;var $pos_1_us_i79=$pos_1_p_us_i78+$pos_023_us_i75|0;var $arrayidx_us_i80=$nargv+($pos_1_us_i79<<2)|0;var $29=HEAP32[$arrayidx_us_i80>>2];HEAP32[$arrayidx_us_i80>>2]=$28;HEAP32[$arrayidx9_us_i86>>2]=$29;var $inc_us_i81=$j_022_us_i76+1|0;var $cmp4_us_i82=($inc_us_i81|0)<($div_i67|0);if($cmp4_us_i82){var $j_022_us_i76=$inc_us_i81;var $pos_023_us_i75=$pos_1_us_i79;var $28=$29;label=42;break}else{label=41;break};case 43:var $i_025_us_i84;var $add_us_i85=$i_025_us_i84+$26|0;var $arrayidx9_us_i86=$nargv+($add_us_i85<<2)|0;var $_pre_i87=HEAP32[$arrayidx9_us_i86>>2];var $j_022_us_i76=0;var $pos_023_us_i75=$add_us_i85;var $28=$_pre_i87;label=42;break;case 44:var $_pre130=HEAP32[10080>>2];var $_pre131=HEAP32[10528>>2];var $_pre132=HEAP32[10520>>2];var $_pr_pre_pre_pre=HEAP32[63136>>2];var $32=$_pre130;var $31=$_pre131;var $30=$_pre132;var $_pr_pre_pre=$_pr_pre_pre_pre;label=45;break;case 45:var $_pr_pre_pre;var $30;var $31;var $32;var $sub7852=$32-$31|0;var $sub79=$sub7852+$30|0;HEAP32[10520>>2]=$sub79;HEAP32[10528>>2]=-1;var $33=$32;var $_pr_pre=$_pr_pre_pre;label=46;break;case 46:var $_pr_pre;var $33;var $inc82=$33+1|0;HEAP32[10080>>2]=$inc82;var $8=$inc82;var $_pr=$_pr_pre;label=12;break;case 47:var $34=HEAP32[10520>>2];var $cmp84=($34|0)!=-1;var $35=HEAP32[10528>>2];var $cmp87=($35|0)==-1;var $or_cond1=$cmp84&$cmp87;if($or_cond1){label=48;break}else{var $37=$23;var $36=$35;label=49;break};case 48:HEAP32[10528>>2]=$12;var $_pre=HEAP8[$arrayidx54];var $37=$_pre;var $36=$12;label=49;break;case 49:var $36;var $37;var $cmp93=$37<<24>>24==0;if($cmp93){var $47=$21;var $46=$12;label=63;break}else{label=50;break};case 50:HEAP32[9800>>2]=$arrayidx54;var $38=HEAP8[$arrayidx54];var $cmp98=$38<<24>>24==45;if($cmp98){label=51;break}else{var $47=$arrayidx54;var $46=$12;label=63;break};case 51:var $arrayidx101=$21+2|0;var $39=HEAP8[$arrayidx101];var $cmp103=$39<<24>>24==0;if($cmp103){label=52;break}else{var $47=$arrayidx54;var $46=$12;label=63;break};case 52:var $inc106=$12+1|0;HEAP32[10080>>2]=$inc106;HEAP32[9800>>2]=146720;var $cmp107=($36|0)==-1;if($cmp107){label=62;break}else{label=53;break};case 53:var $sub_i90=$36-$34|0;var $sub1_i91=$inc106-$36|0;var $rem_i_i92=($sub_i90|0)%($sub1_i91|0)&-1;var $cmp5_i_i93=($rem_i_i92|0)==0;if($cmp5_i_i93){var $b_addr_0_lcssa_i_i99=$sub1_i91;label=55;break}else{var $b_addr_06_i_i95=$sub1_i91;var $c_07_i_i94=$rem_i_i92;label=54;break};case 54:var $c_07_i_i94;var $b_addr_06_i_i95;var $rem1_i_i96=($b_addr_06_i_i95|0)%($c_07_i_i94|0)&-1;var $cmp_i_i97=($rem1_i_i96|0)==0;if($cmp_i_i97){var $b_addr_0_lcssa_i_i99=$c_07_i_i94;label=55;break}else{var $b_addr_06_i_i95=$c_07_i_i94;var $c_07_i_i94=$rem1_i_i96;label=54;break};case 55:var $b_addr_0_lcssa_i_i99;var $sub2_i100=$inc106-$34|0;var $div_i101=($sub2_i100|0)/($b_addr_0_lcssa_i_i99|0)&-1;var $cmp24_i102=($b_addr_0_lcssa_i_i99|0)>0;if($cmp24_i102){label=56;break}else{var $45=$36;var $44=$34;var $43=$inc106;label=61;break};case 56:var $cmp421_i104=($div_i101|0)>0;var $40=-$sub_i90|0;if($cmp421_i104){var $i_025_us_i118=0;label=59;break}else{var $45=$36;var $44=$34;var $43=$inc106;label=61;break};case 57:var $inc13_us_i106=$i_025_us_i118+1|0;var $cmp_us_i107=($inc13_us_i106|0)<($b_addr_0_lcssa_i_i99|0);if($cmp_us_i107){var $i_025_us_i118=$inc13_us_i106;label=59;break}else{label=60;break};case 58:var $41;var $pos_023_us_i109;var $j_022_us_i110;var $cmp6_us_i111=($pos_023_us_i109|0)<($36|0);var $pos_1_p_us_i112=$cmp6_us_i111?$sub1_i91:$40;var $pos_1_us_i113=$pos_1_p_us_i112+$pos_023_us_i109|0;var $arrayidx_us_i114=$nargv+($pos_1_us_i113<<2)|0;var $42=HEAP32[$arrayidx_us_i114>>2];HEAP32[$arrayidx_us_i114>>2]=$41;HEAP32[$arrayidx9_us_i120>>2]=$42;var $inc_us_i115=$j_022_us_i110+1|0;var $cmp4_us_i116=($inc_us_i115|0)<($div_i101|0);if($cmp4_us_i116){var $j_022_us_i110=$inc_us_i115;var $pos_023_us_i109=$pos_1_us_i113;var $41=$42;label=58;break}else{label=57;break};case 59:var $i_025_us_i118;var $add_us_i119=$i_025_us_i118+$36|0;var $arrayidx9_us_i120=$nargv+($add_us_i119<<2)|0;var $_pre_i121=HEAP32[$arrayidx9_us_i120>>2];var $j_022_us_i110=0;var $pos_023_us_i109=$add_us_i119;var $41=$_pre_i121;label=58;break;case 60:var $_pre127=HEAP32[10528>>2];var $_pre128=HEAP32[10520>>2];var $_pre129=HEAP32[10080>>2];var $45=$_pre127;var $44=$_pre128;var $43=$_pre129;label=61;break;case 61:var $43;var $44;var $45;var $sub11051=$44-$45|0;var $sub111=$sub11051+$43|0;HEAP32[10080>>2]=$sub111;label=62;break;case 62:HEAP32[10528>>2]=-1;HEAP32[10520>>2]=-1;var $retval_0=-1;label=106;break;case 63:var $46;var $47;var $cmp115=($long_options|0)!=0;if($cmp115){label=64;break}else{var $50=$47;label=73;break};case 64:var $arrayidx118=$nargv+($46<<2)|0;var $48=HEAP32[$arrayidx118>>2];var $cmp119=($47|0)==($48|0);if($cmp119){var $50=$47;label=73;break}else{label=65;break};case 65:var $49=HEAP8[$47];var $cmp123=$49<<24>>24==45;if($cmp123){label=68;break}else{label=66;break};case 66:var $and126=$flags_addr_0147&4;var $tobool127=($and126|0)==0;if($tobool127){var $50=$47;label=73;break}else{label=67;break};case 67:var $cond154=$49<<24>>24==58;if($cond154){var $short_too_0=0;label=70;break}else{label=69;break};case 68:var $incdec_ptr133=$47+1|0;HEAP32[9800>>2]=$incdec_ptr133;var $short_too_0=0;label=70;break;case 69:var $conv129=$49<<24>>24;var $call140=_strchr($options_addr_0,$conv129);var $not_cmp141=($call140|0)!=0;var $_=$not_cmp141&1;var $short_too_0=$_;label=70;break;case 70:var $short_too_0;var $call146=_parse_long_options($nargv,$options_addr_0,$long_options,$idx,$short_too_0);var $cmp147=($call146|0)==-1;if($cmp147){label=71;break}else{label=72;break};case 71:var $_pre140=HEAP32[9800>>2];var $50=$_pre140;label=73;break;case 72:HEAP32[9800>>2]=146720;var $retval_0=$call146;label=106;break;case 73:var $50;var $incdec_ptr152=$50+1|0;HEAP32[9800>>2]=$incdec_ptr152;var $51=HEAP8[$50];var $conv153=$51<<24>>24;if($51<<24>>24==45){label=74;break}else if($51<<24>>24==58){label=78;break}else{label=75;break};case 74:var $52=HEAP8[$incdec_ptr152];var $cmp161=$52<<24>>24==0;if($cmp161){label=75;break}else{label=80;break};case 75:var $call164=_strchr($options_addr_0,$conv153);var $cmp165=($call164|0)==0;if($cmp165){label=76;break}else{label=84;break};case 76:var $cmp168=$51<<24>>24==45;if($cmp168){label=77;break}else{label=78;break};case 77:var $_pre142=HEAP8[$incdec_ptr152];var $cmp172=$_pre142<<24>>24==0;if($cmp172){var $retval_0=-1;label=106;break}else{label=80;break};case 78:var $_pr150_pr=HEAP8[$incdec_ptr152];var $tobool176=$_pr150_pr<<24>>24==0;if($tobool176){label=79;break}else{label=80;break};case 79:var $53=HEAP32[10080>>2];var $inc178=$53+1|0;HEAP32[10080>>2]=$inc178;label=80;break;case 80:var $54=HEAP32[10224>>2];var $tobool180=($54|0)==0;if($tobool180){label=83;break}else{label=81;break};case 81:var $55=HEAP8[$options_addr_0];var $cmp183=$55<<24>>24==58;if($cmp183){label=83;break}else{label=82;break};case 82:__warnx(12368,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$conv153,tempVarArgs));STACKTOP=tempVarArgs;label=83;break;case 83:HEAP32[10072>>2]=$conv153;var $retval_0=63;label=106;break;case 84:var $cmp191=$51<<24>>24==87;var $or_cond55=$cmp115&$cmp191;var $arrayidx194=$call164+1|0;var $56=HEAP8[$arrayidx194];var $cmp196=$56<<24>>24==59;var $or_cond155=$or_cond55&$cmp196;if($or_cond155){label=85;break}else{label=93;break};case 85:var $57=HEAP8[$incdec_ptr152];var $tobool199=$57<<24>>24==0;if($tobool199){label=86;break}else{label=92;break};case 86:var $58=HEAP32[10080>>2];var $inc202=$58+1|0;HEAP32[10080>>2]=$inc202;var $cmp203=($inc202|0)<($nargc|0);if($cmp203){label=91;break}else{label=87;break};case 87:HEAP32[9800>>2]=146720;var $59=HEAP32[10224>>2];var $tobool206=($59|0)==0;if($tobool206){label=90;break}else{label=88;break};case 88:var $60=HEAP8[$options_addr_0];var $cmp209=$60<<24>>24==58;if($cmp209){label=90;break}else{label=89;break};case 89:__warnx(9552,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$conv153,tempVarArgs));STACKTOP=tempVarArgs;label=90;break;case 90:HEAP32[10072>>2]=$conv153;var $61=HEAP8[$options_addr_0];var $cmp214=$61<<24>>24==58;var $cond=$cmp214?58:63;var $retval_0=$cond;label=106;break;case 91:var $arrayidx217=$nargv+($inc202<<2)|0;var $62=HEAP32[$arrayidx217>>2];HEAP32[9800>>2]=$62;label=92;break;case 92:var $call220=_parse_long_options($nargv,$options_addr_0,$long_options,$idx,0);HEAP32[9800>>2]=146720;var $retval_0=$call220;label=106;break;case 93:var $cmp224=$56<<24>>24==58;if($cmp224){label=96;break}else{label=94;break};case 94:var $63=HEAP8[$incdec_ptr152];var $tobool227=$63<<24>>24==0;if($tobool227){label=95;break}else{var $retval_0=$conv153;label=106;break};case 95:var $64=HEAP32[10080>>2];var $inc229=$64+1|0;HEAP32[10080>>2]=$inc229;var $retval_0=$conv153;label=106;break;case 96:HEAP32[63144>>2]=0;var $65=HEAP8[$incdec_ptr152];var $tobool232=$65<<24>>24==0;if($tobool232){label=98;break}else{label=97;break};case 97:HEAP32[63144>>2]=$incdec_ptr152;label=105;break;case 98:var $arrayidx235=$call164+2|0;var $66=HEAP8[$arrayidx235];var $cmp237=$66<<24>>24==58;if($cmp237){label=105;break}else{label=99;break};case 99:var $67=HEAP32[10080>>2];var $inc240=$67+1|0;HEAP32[10080>>2]=$inc240;var $cmp241=($inc240|0)<($nargc|0);if($cmp241){label=104;break}else{label=100;break};case 100:HEAP32[9800>>2]=146720;var $68=HEAP32[10224>>2];var $tobool244=($68|0)==0;if($tobool244){label=103;break}else{label=101;break};case 101:var $69=HEAP8[$options_addr_0];var $cmp247=$69<<24>>24==58;if($cmp247){label=103;break}else{label=102;break};case 102:__warnx(9552,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$conv153,tempVarArgs));STACKTOP=tempVarArgs;label=103;break;case 103:HEAP32[10072>>2]=$conv153;var $70=HEAP8[$options_addr_0];var $cmp252=$70<<24>>24==58;var $cond254=$cmp252?58:63;var $retval_0=$cond254;label=106;break;case 104:var $arrayidx256=$nargv+($inc240<<2)|0;var $71=HEAP32[$arrayidx256>>2];HEAP32[63144>>2]=$71;label=105;break;case 105:HEAP32[9800>>2]=146720;var $72=HEAP32[10080>>2];var $inc260=$72+1|0;HEAP32[10080>>2]=$inc260;var $retval_0=$conv153;label=106;break;case 106:var $retval_0;STACKTOP=sp;return $retval_0}}function _getopt_long($nargc,$nargv,$options,$long_options,$idx){return _getopt_internal($nargc,$nargv,$options,$long_options,$idx,1)}function _getopt_long_only($nargc,$nargv,$options,$long_options,$idx){return _getopt_internal($nargc,$nargv,$options,$long_options,$idx,5)}function _parse_long_options($nargv,$options,$long_options,$idx,$short_too){var label=0;var tempVarArgs=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $0=HEAP32[9800>>2];var $1=HEAP32[10080>>2];var $inc=$1+1|0;HEAP32[10080>>2]=$inc;var $call=_strchr($0,61);var $cmp=($call|0)==0;if($cmp){label=3;break}else{label=2;break};case 2:var $sub_ptr_lhs_cast=$call;var $sub_ptr_rhs_cast=$0;var $sub_ptr_sub=$sub_ptr_lhs_cast-$sub_ptr_rhs_cast|0;var $incdec_ptr=$call+1|0;var $current_argv_len_0=$sub_ptr_sub;var $has_equal_0=$incdec_ptr;label=4;break;case 3:var $call1=_strlen($0);var $current_argv_len_0=$call1;var $has_equal_0=0;label=4;break;case 4:var $has_equal_0;var $current_argv_len_0;var $name59=$long_options|0;var $2=HEAP32[$name59>>2];var $tobool60=($2|0)==0;if($tobool60){label=37;break}else{label=5;break};case 5:var $tobool14=($short_too|0)!=0;var $cmp15=($current_argv_len_0|0)==1;var $or_cond57=$tobool14&$cmp15;if($or_cond57){var $i_061_us=0;var $3=$2;label=6;break}else{var $i_061=0;var $match_062=-1;var $5=$2;label=9;break};case 6:var $3;var $i_061_us;var $lhsc=HEAP8[$0];var $rhsc=HEAP8[$3];var $tobool5_us=$lhsc<<24>>24==$rhsc<<24>>24;if($tobool5_us){label=7;break}else{label=8;break};case 7:var $call10_us=_strlen($3);var $cmp11_us=($call10_us|0)==1;if($cmp11_us){var $match_2=$i_061_us;label=17;break}else{label=8;break};case 8:var $inc28_us=$i_061_us+1|0;var $name_us=$long_options+($inc28_us<<4)|0;var $4=HEAP32[$name_us>>2];var $tobool_us=($4|0)==0;if($tobool_us){label=37;break}else{var $i_061_us=$inc28_us;var $3=$4;label=6;break};case 9:var $5;var $match_062;var $i_061;var $call4=_strncmp($0,$5,$current_argv_len_0);var $tobool5=($call4|0)==0;if($tobool5){label=10;break}else{var $match_1=$match_062;label=16;break};case 10:var $call10=_strlen($5);var $cmp11=($call10|0)==($current_argv_len_0|0);if($cmp11){var $match_2=$i_061;label=17;break}else{label=11;break};case 11:var $cmp18=($match_062|0)==-1;if($cmp18){var $match_1=$i_061;label=16;break}else{label=12;break};case 12:var $6=HEAP32[10224>>2];var $tobool21=($6|0)==0;if($tobool21){label=15;break}else{label=13;break};case 13:var $7=HEAP8[$options];var $cmp23=$7<<24>>24==58;if($cmp23){label=15;break}else{label=14;break};case 14:__warnx(17568,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempVarArgs>>2]=$current_argv_len_0,HEAP32[tempVarArgs+8>>2]=$0,tempVarArgs));STACKTOP=tempVarArgs;label=15;break;case 15:HEAP32[10072>>2]=0;var $retval_0=63;label=47;break;case 16:var $match_1;var $inc28=$i_061+1|0;var $name=$long_options+($inc28<<4)|0;var $8=HEAP32[$name>>2];var $tobool=($8|0)==0;if($tobool){var $match_2=$match_1;label=17;break}else{var $i_061=$inc28;var $match_062=$match_1;var $5=$8;label=9;break};case 17:var $match_2;var $cmp29=($match_2|0)==-1;if($cmp29){label=37;break}else{label=18;break};case 18:var $has_arg=$long_options+($match_2<<4)+4|0;var $9=HEAP32[$has_arg>>2];var $cmp33=($9|0)!=0;var $tobool36=($has_equal_0|0)==0;var $or_cond58=$cmp33|$tobool36;if($or_cond58){label=25;break}else{label=19;break};case 19:var $10=HEAP32[10224>>2];var $tobool38=($10|0)==0;if($tobool38){label=22;break}else{label=20;break};case 20:var $11=HEAP8[$options];var $cmp41=$11<<24>>24==58;if($cmp41){label=22;break}else{label=21;break};case 21:__warnx(10536,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempVarArgs>>2]=$current_argv_len_0,HEAP32[tempVarArgs+8>>2]=$0,tempVarArgs));STACKTOP=tempVarArgs;label=22;break;case 22:var $flag=$long_options+($match_2<<4)+8|0;var $12=HEAP32[$flag>>2];var $cmp46=($12|0)==0;if($cmp46){label=23;break}else{var $storemerge56=0;label=24;break};case 23:var $val=$long_options+($match_2<<4)+12|0;var $13=HEAP32[$val>>2];var $storemerge56=$13;label=24;break;case 24:var $storemerge56;HEAP32[10072>>2]=$storemerge56;var $14=HEAP8[$options];var $cmp53=$14<<24>>24==58;var $cond=$cmp53?58:63;var $retval_0=$cond;label=47;break;case 25:var $_off=$9-1|0;var $switch=$_off>>>0<2;if($switch){label=26;break}else{label=30;break};case 26:if($tobool36){label=28;break}else{label=27;break};case 27:HEAP32[63144>>2]=$has_equal_0;label=30;break;case 28:var $cmp70=($9|0)==1;if($cmp70){label=29;break}else{label=30;break};case 29:var $inc73=$1+2|0;HEAP32[10080>>2]=$inc73;var $arrayidx74=$nargv+($inc<<2)|0;var $15=HEAP32[$arrayidx74>>2];HEAP32[63144>>2]=$15;label=30;break;case 30:var $16=HEAP32[$has_arg>>2];var $cmp80=($16|0)==1;var $17=HEAP32[63144>>2];var $cmp83=($17|0)==0;var $or_cond=$cmp80&$cmp83;if($or_cond){label=31;break}else{label=43;break};case 31:var $18=HEAP32[10224>>2];var $tobool86=($18|0)==0;if($tobool86){label=34;break}else{label=32;break};case 32:var $19=HEAP8[$options];var $cmp89=$19<<24>>24==58;if($cmp89){label=34;break}else{label=33;break};case 33:__warnx(9512,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$0,tempVarArgs));STACKTOP=tempVarArgs;label=34;break;case 34:var $flag94=$long_options+($match_2<<4)+8|0;var $20=HEAP32[$flag94>>2];var $cmp95=($20|0)==0;if($cmp95){label=35;break}else{var $storemerge=0;label=36;break};case 35:var $val99=$long_options+($match_2<<4)+12|0;var $21=HEAP32[$val99>>2];var $storemerge=$21;label=36;break;case 36:var $storemerge;HEAP32[10072>>2]=$storemerge;var $22=HEAP32[10080>>2];var $dec=$22-1|0;HEAP32[10080>>2]=$dec;var $23=HEAP8[$options];var $cmp103=$23<<24>>24==58;var $cond105=$cmp103?58:63;var $retval_0=$cond105;label=47;break;case 37:var $tobool108=($short_too|0)==0;if($tobool108){label=39;break}else{label=38;break};case 38:HEAP32[10080>>2]=$1;var $retval_0=-1;label=47;break;case 39:var $24=HEAP32[10224>>2];var $tobool112=($24|0)==0;if($tobool112){label=42;break}else{label=40;break};case 40:var $25=HEAP8[$options];var $cmp115=$25<<24>>24==58;if($cmp115){label=42;break}else{label=41;break};case 41:__warnx(12344,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$0,tempVarArgs));STACKTOP=tempVarArgs;label=42;break;case 42:HEAP32[10072>>2]=0;var $retval_0=63;label=47;break;case 43:var $tobool120=($idx|0)==0;if($tobool120){label=45;break}else{label=44;break};case 44:HEAP32[$idx>>2]=$match_2;label=45;break;case 45:var $flag124=$long_options+($match_2<<4)+8|0;var $26=HEAP32[$flag124>>2];var $tobool125=($26|0)==0;var $val128=$long_options+($match_2<<4)+12|0;var $27=HEAP32[$val128>>2];if($tobool125){var $retval_0=$27;label=47;break}else{label=46;break};case 46:HEAP32[$26>>2]=$27;var $retval_0=0;label=47;break;case 47:var $retval_0;STACKTOP=sp;return $retval_0}}function __err($eval,$fmt,varrp){var sp=STACKTOP;STACKTOP=STACKTOP+16|0;var $ap=sp;var $arraydecay1=$ap;HEAP32[$arraydecay1>>2]=varrp;HEAP32[$arraydecay1+4>>2]=0;__verr($eval,$fmt,$ap|0);STACKTOP=sp;return}function __errx($eval,$fmt,varrp){var sp=STACKTOP;STACKTOP=STACKTOP+16|0;var $ap=sp;var $arraydecay1=$ap;HEAP32[$arraydecay1>>2]=varrp;HEAP32[$arraydecay1+4>>2]=0;__verrx($eval,$fmt,$ap|0);STACKTOP=sp;return}function __warn($fmt,varrp){var sp=STACKTOP;STACKTOP=STACKTOP+16|0;var $ap=sp;var $arraydecay1=$ap;HEAP32[$arraydecay1>>2]=varrp;HEAP32[$arraydecay1+4>>2]=0;__vwarn($fmt,$ap|0);STACKTOP=sp;return}function __warnx($fmt,varrp){var sp=STACKTOP;STACKTOP=STACKTOP+16|0;var $ap=sp;var $arraydecay1=$ap;HEAP32[$arraydecay1>>2]=varrp;HEAP32[$arraydecay1+4>>2]=0;__vwarnx($fmt,$ap|0);STACKTOP=sp;return}function __verr($eval,$fmt,$ap){var label=0;var tempVarArgs=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $call=___errno_location();var $0=HEAP32[$call>>2];var $1=HEAP32[_stderr>>2];var $2=HEAP32[___progname>>2];var $call1=_fprintf($1,17648,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$2,tempVarArgs));STACKTOP=tempVarArgs;var $cmp=($fmt|0)==0;if($cmp){label=3;break}else{label=2;break};case 2:var $call2=_vfprintf($1,$fmt,$ap);var $3=_fwrite(22792,2,1,$1);label=3;break;case 3:var $call4=_strerror($0);var $call5=_fprintf($1,21280,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$call4,tempVarArgs));STACKTOP=tempVarArgs;_exit($eval)}}function __verrx($eval,$fmt,$ap){var label=0;var tempVarArgs=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $0=HEAP32[_stderr>>2];var $1=HEAP32[___progname>>2];var $call=_fprintf($0,21728,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$1,tempVarArgs));STACKTOP=tempVarArgs;var $cmp=($fmt|0)==0;if($cmp){label=3;break}else{label=2;break};case 2:var $call1=_vfprintf($0,$fmt,$ap);label=3;break;case 3:var $fputc=_fputc(10,$0);_exit($eval)}}function __vwarn($fmt,$ap){var label=0;var tempVarArgs=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $call=___errno_location();var $0=HEAP32[$call>>2];var $1=HEAP32[_stderr>>2];var $2=HEAP32[___progname>>2];var $call1=_fprintf($1,21448,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$2,tempVarArgs));STACKTOP=tempVarArgs;var $cmp=($fmt|0)==0;if($cmp){label=3;break}else{label=2;break};case 2:var $call2=_vfprintf($1,$fmt,$ap);var $3=_fwrite(22664,2,1,$1);label=3;break;case 3:var $call4=_strerror($0);var $call5=_fprintf($1,21240,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$call4,tempVarArgs));STACKTOP=tempVarArgs;STACKTOP=sp;return}}function __vwarnx($fmt,$ap){var label=0;var tempVarArgs=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $0=HEAP32[_stderr>>2];var $1=HEAP32[___progname>>2];var $call=_fprintf($0,21176,(tempVarArgs=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempVarArgs>>2]=$1,tempVarArgs));STACKTOP=tempVarArgs;var $cmp=($fmt|0)==0;if($cmp){label=3;break}else{label=2;break};case 2:var $call1=_vfprintf($0,$fmt,$ap);label=3;break;case 3:var $fputc=_fputc(10,$0);STACKTOP=sp;return}}function _strtod($string,$endPtr){var label=0;label=1;while(1)switch(label){case 1:var $p_0=$string;label=2;break;case 2:var $p_0;var $0=HEAP8[$p_0];var $conv=$0<<24>>24;var $call=_isspace($conv);var $tobool=($call|0)==0;var $add_ptr=$p_0+1|0;if($tobool){label=3;break}else{var $p_0=$add_ptr;label=2;break};case 3:var $1=HEAP8[$p_0];if($1<<24>>24==45){label=4;break}else if($1<<24>>24==43){label=5;break}else{var $p_2=$p_0;var $sign_0=0;label=6;break};case 4:var $p_2=$add_ptr;var $sign_0=1;label=6;break;case 5:var $p_2=$add_ptr;var $sign_0=0;label=6;break;case 6:var $sign_0;var $p_2;var $decPt_0=-1;var $mantSize_0=0;var $p_3=$p_2;label=7;break;case 7:var $p_3;var $mantSize_0;var $decPt_0;var $2=HEAP8[$p_3];var $conv10=$2<<24>>24;var $sub=$conv10-48|0;var $cmp11=$sub>>>0<10;if($cmp11){var $decPt_1=$decPt_0;label=9;break}else{label=8;break};case 8:var $cmp14=$2<<24>>24!=46;var $cmp16=($decPt_0|0)>-1;var $or_cond=$cmp14|$cmp16;if($or_cond){label=10;break}else{var $decPt_1=$mantSize_0;label=9;break};case 9:var $decPt_1;var $add_ptr21=$p_3+1|0;var $add=$mantSize_0+1|0;var $decPt_0=$decPt_1;var $mantSize_0=$add;var $p_3=$add_ptr21;label=7;break;case 10:var $idx_neg=-$mantSize_0|0;var $add_ptr22=$p_3+$idx_neg|0;var $cmp23=($decPt_0|0)<0;var $not_cmp23=$cmp23^1;var $sub27=$not_cmp23<<31>>31;var $mantSize_1=$sub27+$mantSize_0|0;var $decPt_2=$cmp23?$mantSize_0:$decPt_0;var $cmp29=($mantSize_1|0)>18;var $3=-$mantSize_1|0;var $fracExp_0_p=$cmp29?-18:$3;var $fracExp_0=$fracExp_0_p+$decPt_2|0;var $mantSize_2=$cmp29?18:$mantSize_1;var $cmp36=($mantSize_2|0)==0;if($cmp36){var $p_11=$string;var $fraction_0=0;label=37;break}else{label=11;break};case 11:var $cmp4177=($mantSize_2|0)>9;if($cmp4177){var $p_478=$add_ptr22;var $mantSize_379=$mantSize_2;var $frac1_080=0;label=15;break}else{label=13;break};case 12:var $phitmp=$add52|0;var $phitmp84=$phitmp*1e9;var $frac1_0_lcssa88=$phitmp84;var $mantSize_3_lcssa89=9;var $p_4_lcssa90=$p_5;label=14;break;case 13:var $cmp5772=($mantSize_2|0)>0;if($cmp5772){var $frac1_0_lcssa88=0;var $mantSize_3_lcssa89=$mantSize_2;var $p_4_lcssa90=$add_ptr22;label=14;break}else{var $frac2_0_lcssa=0;var $frac1_0_lcssa87=0;label=22;break};case 14:var $p_4_lcssa90;var $mantSize_3_lcssa89;var $frac1_0_lcssa88;var $p_673=$p_4_lcssa90;var $mantSize_474=$mantSize_3_lcssa89;var $frac2_075=0;label=18;break;case 15:var $frac1_080;var $mantSize_379;var $p_478;var $4=HEAP8[$p_478];var $add_ptr44=$p_478+1|0;var $cmp45=$4<<24>>24==46;if($cmp45){label=16;break}else{var $c_0_in=$4;var $p_5=$add_ptr44;label=17;break};case 16:var $5=HEAP8[$add_ptr44];var $add_ptr49=$p_478+2|0;var $c_0_in=$5;var $p_5=$add_ptr49;label=17;break;case 17:var $p_5;var $c_0_in;var $c_0=$c_0_in<<24>>24;var $mul=$frac1_080*10&-1;var $sub51=$mul-48|0;var $add52=$sub51+$c_0|0;var $sub54=$mantSize_379-1|0;var $cmp41=($sub54|0)>9;if($cmp41){var $p_478=$p_5;var $mantSize_379=$sub54;var $frac1_080=$add52;label=15;break}else{label=12;break};case 18:var $frac2_075;var $mantSize_474;var $p_673;var $6=HEAP8[$p_673];var $add_ptr61=$p_673+1|0;var $cmp62=$6<<24>>24==46;if($cmp62){label=19;break}else{var $c_1_in=$6;var $p_7=$add_ptr61;label=20;break};case 19:var $7=HEAP8[$add_ptr61];var $add_ptr66=$p_673+2|0;var $c_1_in=$7;var $p_7=$add_ptr66;label=20;break;case 20:var $p_7;var $c_1_in;var $c_1=$c_1_in<<24>>24;var $mul68=$frac2_075*10&-1;var $sub69=$mul68-48|0;var $add70=$sub69+$c_1|0;var $sub72=$mantSize_474-1|0;var $cmp57=($sub72|0)>0;if($cmp57){var $p_673=$p_7;var $mantSize_474=$sub72;var $frac2_075=$add70;label=18;break}else{label=21;break};case 21:var $phitmp85=$add70|0;var $frac2_0_lcssa=$phitmp85;var $frac1_0_lcssa87=$frac1_0_lcssa88;label=22;break;case 22:var $frac1_0_lcssa87;var $frac2_0_lcssa;var $add77=$frac1_0_lcssa87+$frac2_0_lcssa;if($2<<24>>24==69|$2<<24>>24==101){label=23;break}else{var $exp_1=0;var $p_10=$p_3;var $expSign_1=0;label=28;break};case 23:var $add_ptr87=$p_3+1|0;var $8=HEAP8[$add_ptr87];if($8<<24>>24==45){label=24;break}else if($8<<24>>24==43){label=25;break}else{var $p_9_ph=$add_ptr87;var $expSign_0_ph=0;label=26;break};case 24:var $add_ptr92=$p_3+2|0;var $p_9_ph=$add_ptr92;var $expSign_0_ph=1;label=26;break;case 25:var $add_ptr98=$p_3+2|0;var $p_9_ph=$add_ptr98;var $expSign_0_ph=0;label=26;break;case 26:var $expSign_0_ph;var $p_9_ph;var $9=HEAP8[$p_9_ph];var $conv10264=$9<<24>>24;var $sub10365=$conv10264-48|0;var $cmp10466=$sub10365>>>0<10;if($cmp10466){var $p_967=$p_9_ph;var $exp_068=0;var $conv10269=$conv10264;label=27;break}else{var $exp_1=0;var $p_10=$p_9_ph;var $expSign_1=$expSign_0_ph;label=28;break};case 27:var $conv10269;var $exp_068;var $p_967;var $mul107=$exp_068*10&-1;var $sub109=$mul107-48|0;var $add110=$sub109+$conv10269|0;var $add_ptr111=$p_967+1|0;var $10=HEAP8[$add_ptr111];var $conv102=$10<<24>>24;var $sub103=$conv102-48|0;var $cmp104=$sub103>>>0<10;if($cmp104){var $p_967=$add_ptr111;var $exp_068=$add110;var $conv10269=$conv102;label=27;break}else{var $exp_1=$add110;var $p_10=$add_ptr111;var $expSign_1=$expSign_0_ph;label=28;break};case 28:var $expSign_1;var $p_10;var $exp_1;var $tobool114=($expSign_1|0)==0;var $11=-$exp_1|0;var $exp_2_p=$tobool114?$exp_1:$11;var $exp_2=$fracExp_0+$exp_2_p|0;var $cmp120=($exp_2|0)<0;var $sub123=-$exp_2|0;var $exp_3=$cmp120?$sub123:$exp_2;var $cmp126=($exp_3|0)>511;if($cmp126){label=29;break}else{label=30;break};case 29:var $call129=___errno_location();HEAP32[$call129>>2]=34;var $dblExp_061=1;var $d_062=9728;var $exp_563=511;label=31;break;case 30:var $cmp13260=($exp_3|0)==0;if($cmp13260){var $dblExp_0_lcssa=1;label=34;break}else{var $dblExp_061=1;var $d_062=9728;var $exp_563=$exp_3;label=31;break};case 31:var $exp_563;var $d_062;var $dblExp_061;var $and=$exp_563&1;var $tobool135=($and|0)==0;if($tobool135){var $dblExp_1=$dblExp_061;label=33;break}else{label=32;break};case 32:var $12=HEAPF64[$d_062>>3];var $mul137=$dblExp_061*$12;var $dblExp_1=$mul137;label=33;break;case 33:var $dblExp_1;var $shr=$exp_563>>1;var $add_ptr140=$d_062+8|0;var $cmp132=($shr|0)==0;if($cmp132){var $dblExp_0_lcssa=$dblExp_1;label=34;break}else{var $dblExp_061=$dblExp_1;var $d_062=$add_ptr140;var $exp_563=$shr;label=31;break};case 34:var $dblExp_0_lcssa;var $tobool142=($exp_2|0)>-1;if($tobool142){label=36;break}else{label=35;break};case 35:var $div=$add77/$dblExp_0_lcssa;var $p_11=$p_10;var $fraction_0=$div;label=37;break;case 36:var $mul145=$add77*$dblExp_0_lcssa;var $p_11=$p_10;var $fraction_0=$mul145;label=37;break;case 37:var $fraction_0;var $p_11;var $cmp147=($endPtr|0)==0;if($cmp147){label=39;break}else{label=38;break};case 38:HEAP32[$endPtr>>2]=$p_11;label=39;break;case 39:var $tobool151=($sign_0|0)==0;if($tobool151){var $retval_0=$fraction_0;label=41;break}else{label=40;break};case 40:var $sub153=-$fraction_0;var $retval_0=$sub153;label=41;break;case 41:var $retval_0;return $retval_0}}function _strtold($nptr,$endptr){return _strtod($nptr,$endptr)}function _strtof($nptr,$endptr){return _strtod($nptr,$endptr)}function _strtod_l($nptr,$endptr,$loc){return _strtod($nptr,$endptr)}function _strtold_l($nptr,$endptr,$loc){return _strtod($nptr,$endptr)}function _atof($str){return _strtod($str,0)}
// EMSCRIPTEN_END_FUNCS
Module["_malloc"] = _malloc;
Module["_free"] = _free;
Module["_calloc"] = _calloc;
Module["_realloc"] = _realloc;
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
var calledRun = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun && shouldRunNow) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + (new Error().stack);
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
// libmp3lame function wrappers
var BUFSIZE = 8192;
return {
	STEREO: 0, 
	JOINT_STEREO: 1, 
	MONO: 3,
	get_version: Module.cwrap('get_lame_version', 'string'),
	init: Module.cwrap('lame_init', 'number'),
	init_params: Module.cwrap('lame_init_params', 'number', [ 'number' ]),
	set_mode: Module.cwrap('lame_set_mode', 'number', [ 'number', 'number' ]),
	get_mode: Module.cwrap('lame_get_mode', 'number', [ 'number' ]),
	set_num_samples: Module.cwrap('lame_set_num_samples', 'number', [ 'number', 'number' ]),
	get_num_samples: Module.cwrap('lame_get_num_samples', 'number', [ 'number' ]),
	set_num_channels: Module.cwrap('lame_set_num_channels', 'number', [ 'number', 'number' ]),
	get_num_channels: Module.cwrap('lame_get_num_channels', 'number', [ 'number' ]),
	set_in_samplerate: Module.cwrap('lame_set_in_samplerate', 'number', [ 'number', 'number' ]),
	get_in_samplerate: Module.cwrap('lame_get_in_samplerate', 'number', [ 'number' ]),
	set_out_samplerate: Module.cwrap('lame_set_out_samplerate', 'number', [ 'number', 'number' ]),
	get_out_samplerate: Module.cwrap('lame_get_out_samplerate', 'number', [ 'number' ]),
	set_bitrate: Module.cwrap('lame_set_brate', 'number', [ 'number', 'number' ]),
	get_bitrate: Module.cwrap('lame_get_brate', 'number', [ 'number' ]),
	encode_buffer_ieee_float: function(handle, channel_l, channel_r) {
		var outbuf = _malloc(BUFSIZE);
		var inbuf_l = _malloc(channel_l.length * 4);
		var inbuf_r = _malloc(channel_r.length * 4);
		for (var i=0;i<channel_l.length;i++) {
			setValue(inbuf_l + (i*4), channel_l[i], 'float');
		}
		for (var i=0;i<channel_r.length;i++) {
			setValue(inbuf_r + (i*4), channel_r[i], 'float');
		}
		var nread = Module.ccall('lame_encode_buffer_ieee_float', 'number', [ 'number', 'number', 'number', 'number', 'number', 'number' ], [ handle, inbuf_l, inbuf_r, channel_l.length, outbuf, BUFSIZE ]);
		var arraybuf = new ArrayBuffer(nread);
		var retdata = new Uint8Array(arraybuf);
		retdata.set(HEAPU8.subarray(outbuf, outbuf + nread));
		_free(outbuf);
		_free(inbuf_l);
		_free(inbuf_r);
		return { size: nread, data: retdata };
	},
	encode_flush: function(handle) {
		var outbuf = _malloc(BUFSIZE);
		var nread = Module.ccall('lame_encode_flush', 'number', [ 'number', 'number', 'number' ], [ handle, outbuf, BUFSIZE ]);
		var arraybuf = new ArrayBuffer(nread);
		var retdata = new Uint8Array(arraybuf);
		retdata.set(HEAPU8.subarray(outbuf, outbuf + nread));
		_free(outbuf);
		return { size: nread, data: retdata };
	},
	close: Module.cwrap('lame_close', 'number', [ 'number' ])
};
})();

module.exports = Lame;