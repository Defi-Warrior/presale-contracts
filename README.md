# Defi Warrior
## Mainnet
Presale Addr: 0x197aA5288Ca0ccb5Ac334713dB197c29aCd0885A

FIWA Token: 0x43422EfA677FA2a9627d52aC42D9cF60A5F0c67b

Public Sale Setting: 0x72FFb9aED92e4aDDF3F23Af3504C62152C147ab7

Private Sale Setting: 0xbCdF4f5Ef7Ce225Cb7f0e8CAD02886Db76c279e2

Seeding Sale Setting: 0x0eaBd952C17ddAD9B65696C41a04fe7fab14740f

Locker: 0x8984b76CBBc7C8b68877254272553989890371B8

## Testnet

Presale Addr: 0xF772e5889E1E141b9e14e16443a2A76dF7188779

FIWA Token: 0xc997764Be93Ef0A9EDF17FDb408a851a8b13ceE7

Public Sale Setting: 0xfd2b24a775e0574310B09E09205640f2d55a3864

Private Sale Setting: 0xB4bfA761C96d486e06907222b02C01707Db48f30

Seeding Sale Setting: 0xb0f7538B13D82188E968511a13dF0ba9F356D03f

Locker: 0x284751126c16F13EBFe4a7d26342302AE4565039

BUSD: 0x26C84EAeC7735a3B263bde1368f586791DBB978A

USDT: 0xF9148233A42787147Cab2690B90ea962Adc22126

Anh cung cấp 1 số contract để em lấy thông tin đưa lên web nhé (nhớ lưu làm file config vì sau này có thể sẽ cần đổi địa chỉ)
Contract Presale: 0xF772e5889E1E141b9e14e16443a2A76dF7188779
Chứa các thông tin:
- Tổng số token đã bán ra: "totalTokenSold"
- Tổng số token đã bán của giai đoạn presale hiện tại: "totalSold"
Gọi lên contract này và đọc các thông tin này về như sau:
- contract.methods.totalTokenSold().call(err, result =>)
- contract.methods.totalSold("0xF772e5889E1E141b9e14e16443a2A76dF7188779").call(err, result =>)
Tham số của hàm totalSold sẽ là địa chỉ của presale setting Hiện tại, tùy vào giai đoạn mà ta sẽ truyền vào địa chỉ khác nhau.

Contract Presale Setting, có nhiều giai đoạn presale nên sẽ có nhiều setting, dự kiến sẽ có 7 giai đoạn, hiện ta demo 3 giai đoạn trước
Public Sale Setting: 0xfd2b24a775e0574310B09E09205640f2d55a3864

Private Sale Setting: 0xB4bfA761C96d486e06907222b02C01707Db48f30

Seeding Sale Setting: 0xb0f7538B13D82188E968511a13dF0ba9F356D03f

Các contract này đều có interface giống hệt nhau, chỉ khác là giá trị config.
Chứa các thông tin sau:
- name: tên của giai đoạn presale
- start: block number lúc bắt đầu presale
- end: block number lúc kết thúc presale
- price: giá của token quy ra USDT, ví dụ price là 500 thì 1 usdt = 500 FIWA
- minPurchase: số lượng usdt tối thiểu cần phải bỏ ra để mua token, ví dụ 100 => phải mua tối đa 100 usdt
- totalSupply: tổng lượng token phân phối trong presale stage đó
- Available FIWA: bằng totalSupply - totalSold