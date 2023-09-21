/**
 * Author: Anshita Khare
 * A program that is a dissembler for 9 MIPS instructions
 * */
class Disassembler {
    //R-TYPE AND I-TYPE SHARED BITMASKS
        //OP Code Bitmask
        static OPBM = 0xFC000000;

        //SRC 1 Bitmask
        static SRC1BM = 0x03E00000;

        //SRC 2 or Destination Bitmask
        static SRC2DESTBM = 0x001F0000;
	
    //R-TYPE SPECIFIC BITMASKS
        //Desination Bitmask
        static DESTBM =  0x0000F800;

        //Function Bitmask
        static FUNCBM = 0x00000003F;

    //I-TYPE SPECIFIC BITMASK
        //Offset/Constant Bitmask
        static OFFSBM = 0x0000FFFF;

    //OPCODE DICTIONARY
    static opcodeDict = {
        0:'rtyp',
        4:'beq',
        5:'bne',
        35:'lw',
        43:'sw'
    }

    //FUNCTION DICTIONARY
    static functionDict = {
        32:'add',
        34:'sub',
        36:'and',
        37:'or',
        42:'slt'
    }

    toShort(number) {
        const int16 = new Int16Array(1)
        int16[0] = number
        return int16[0]
    }

    constructor(currAddress){
        /**Assuming that we are given the address of the first instruction, 
         * subtract 4 so that the adress for the first instruction is not incremented by this.disassemble*/
        this.currAddress = currAddress - 4;
    }

    disassemble(hexInstruction){
        const opcode = (hexInstruction & Disassembler.OPBM) >>> 26

        if( !Disassembler.opcodeDict.hasOwnProperty(opcode)){
            return "Error: unable to process that opcode: " + opcode.toString(16);
        } 

        switch (opcode) {
            //R-Format Instruction
            case 0:{
                const func = (hexInstruction & Disassembler.FUNCBM)
                if( !Disassembler.functionDict.hasOwnProperty(func)){
                    return "Error: unable to process that function code: " + func.toString(16);
                } 

                const result = []
                this.currAddress += 4;
                
                result.push(this.currAddress.toString(16))
                result.push(Disassembler.functionDict[func])

                const dest = (hexInstruction & Disassembler.DESTBM) >>> 11
                const src1 = (hexInstruction & Disassembler.SRC1BM) >>> 21;
                const src2 = (hexInstruction & Disassembler.SRC2DESTBM)>>> 16;

                result.push(`$${dest}, $${src1}, $${src2}`)
                return result.join(" ");
            }

            //Load Word and Store Word
            case 35:
            case 43: {
                const result = []
                this.currAddress += 4;

                result.push(this.currAddress.toString(16))
                result.push(Disassembler.opcodeDict[opcode])

                const src1 = (hexInstruction & Disassembler.SRC1BM) >>> 21;
                const src2 = (hexInstruction & Disassembler.SRC2DESTBM)>>> 16;

                const constant = this.toShort(hexInstruction & Disassembler.OFFSBM);

                result.push(`$${src2}, ${constant}($${src1})`)
                return result.join(" ");
            }

            //Branch on Equal and Branch on Not Equal
            case 4: 
            case 5: {
                const result = []
                this.currAddress += 4;

                result.push(this.currAddress.toString(16))
                result.push(Disassembler.opcodeDict[opcode])

                const src1 = (hexInstruction & Disassembler.SRC1BM) >>> 21;
                const src2 = (hexInstruction & Disassembler.SRC2DESTBM)>>> 16;

                const offset = this.toShort(hexInstruction & Disassembler.OFFSBM);
                
                /** "Trick 1": Because instructions are ALWAYS on a full word boundary 
                 * in order to take advantage of increasing the distance between the branch instruction
                 * and the labeled instruction, this offset is always shifted right by two bits, 
                 * thereby dropping off the last two 00’s in the offset. To undo this, left shift the offset by 2*/
                let labelAddress = offset << 2;

                /** "Trick 2": when you’re working with the machine instruction, 
                 * this calculation is more accurately performed by using the address of the instruction that FOLLOWS the branch*/
                labelAddress += 4 + this.currAddress;
            
                result.push(`$${src1}, $${src2}, address ${labelAddress.toString(16)}`)
                
                return result.join(" ");
            }
        }
    }

    process(inputArr){
        const result = [];
        for (let i = 0; i < inputArr.length; i++){
            result.push(this.disassemble(inputArr[i]));
        }
        return result
    }
}//End of class Disassemble