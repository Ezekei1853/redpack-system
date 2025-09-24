pragma solidity >=0.7.0 <0.9.0;
//抢红包的合约
contract Redpack{
    uint256 public blance;
    bool public isEqual;
    uint256 public  totalAmount;
    address public  payable yxa;
    uint256 public count;
    mapping(address => uint256) public isGrabbed;
    constructor(uint256 c,bool _isEqual) payable{
      require(msg.value>0)
      count = _c;
      isEqual = _isEqual;
      totalAmont = msg.value
    }
    function getBalace () public view returns(unit256){
        return address(this).blance;
    }
    function despoit() payable public {
        totalAmont+=msg.value
    }
    function getPacket() public{

        require(msg.value>0);
        require(totalAmount>0);
        require(total>0);
        require(isGrabbed[msg.sender]>0);
        if(count==1){
            uint256 amount = totalAmount/count; 
            payable(msg.sender).transfer(amount);
            totalAmount-=amount;
        }else{
             if(isEqual){
               uint256 amount = totalAmount / count;
                  payable(msg.sender).transfer(amount);
                totalAmount -= amount;   
             }else{
                  uint256 maxAmount = totalAmount * 2 / count;
                uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, count))) % maxAmount;
                uint256 amount = random + 1; // 确保至少给1 wei
                
                // 确保不超过剩余金额
                if(amount > totalAmount) {
                    amount = totalAmount;
                }
                
                payable(msg.sender).transfer(amount);
                totalAmount -= amount;
             }
        }
        count--;
    }
    
}