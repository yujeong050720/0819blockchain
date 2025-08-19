const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

// DB 모듈 함수 불러오기 (엑셀 파일 I/O 모듈)
const { calcConfirmScores } = require('./ConfirmScore');    // 인증점수 계산 및 저장
const { selectVerifiers } = require('./Confirm');            // 인증점수 기반 검증자 선정
const { processClick, recordClick, loadClicks } = require('./Click');  // 클릭 기록 처리

const app = express(); //콜백함수 모음(미들웨어)
const server = http.createServer(app); //누군가 들어오는 요청을 받아서 처리하는 역할, 포트를 여는 역할
const io = socketio(server);

// JSON 바디 파싱용 (API를 위한)
//-클라이언트가 보낸 JSON 형식의 요청 바디(request body)를 자동으로 해석(파싱)해 주는 미들웨어
//-HTTP 요청은 텍스트 형식 -> JSON 데이터도 문자로 옴 -> express.json()이 알아서 분해, 변환해 줌 -> 편리!
app.use(express.json());

// 정적 파일 서빙 (index.html 등)
//Express에 express.static()을 설정 -> public 폴더 안에 있는 파일들을 주소(URL)로 쉽게 접근 가능하게 해줌
app.use(express.static(path.join(__dirname, 'public')));

// 신규 사용자 승인 저장 API (예: 2/3 이상 찬성일 때 호출)
//여기서의 req.body는 클라이언트가 서버로 보낸 데이터(정보)가 들어있음
app.post('/api/approveUser', (req, res) => {
  const { candidate, nickname, approvers, link } = req.body;
  //= req.body에 담긴 데이터를 각 변수에 분리해서 쓰자
  //candidate : 새 사용자 지갑 주소

  //candidate, nickname, link가 없거나 빈 값이면 → approvers가 배열이 아니면(예: null, 문자열 등) 실행
  if (!candidate || !nickname || !Array.isArray(approvers) || !link) {
    return res.status(400).json({ error: '잘못된 요청 데이터' });
  }

  //Click.js/processClick() 호출 -> nameDB.xlsx에 신규 사용자 정보(candidate, nickname) 저장
  //(!!!) DB모듈 별도 구현 권장한다는데, 일단은 server.js에 구현해 둠
  // 여기서는 processClick 사용 예시 (필요에 따라 별도 전용 함수 작성 권장)
  processClick(candidate, nickname, 'profileLinkPlaceholder'); // 예시, 실제 필드 맞게 조정 필요

  // 찬성한 검증자들 클릭 기록 저장
  //서버(또는 별도 API)에서 2/3 이상 찬성 여부를 판단한 이후에만 실행
  //2/3 이상 찬성 판정이 완료 
  //-> 찬성한 검증자 목록인 approvers 배열을 받기 
  //-> 그 검증자들에 대해 클릭 기록을 엑셀파일에 저장
  approvers.forEach(validator => {
    recordClick(validator, candidate, link);
  });

  //누가 언제 승인되었고 클릭 기록이 정상 저장되었는지 확인
  console.log(`사용자 ${candidate} 승인 및 클릭 기록 저장 완료`);

  //{ status: 'success' } 객체를 JSON으로 변환해서 클라이언트에 전달
  res.json({ status: 'success' });
});

const pendingVerifications = {}; // 후보자별 투표 상태 저장
let validators = [];
//key : 후보자의 지갑 주소(보통 소문자화된 주소),
//value : 해당 후보자에 대한 투표 관련 정보(찬성/반대 투표 현황, 닉네임, 링크 등)

const userSockets = new Map();  // 사용자(지갑주소) -> 소켓ID
//Map() : set(key, value)로 데이터를 저장하고, get(key)로 값을 꺼낼 수 있음

io.on('connection', (socket) => {
  console.log(`클라이언트 연결됨: ${socket.id}`);

  // 사용자 지갑주소와 닉네임 등록, 기존 사용자인지 확인
  socket.on('registerUser', async ({ walletAddr, nickname }) => {
    const normalizedWallet = walletAddr.toLowerCase();
    //toLowerCase() : 문자열을 모두 소문자로 변환

    // 1) nameDB.xlsx에서 walletAddr + nickname 쌍 존재 여부 확인 함수 호출 (별도 DB모듈 구현 필수)
    const isExistingUser = await checkUserExistsInNameDB(normalizedWallet, nickname);
    //checkUserExistsInNameDB : nameDB.xlsx 파일에서 특정 사용자가 존재하는지 확인

    // 2) 기존 사용자면 바로 매핑 후 승인 절차 생략 가능
    if (isExistingUser) { //isExistingUser가 true라면 = 기존에 nameDB.xlsx에 등록된 사용자
      userSockets.set(normalizedWallet, socket.id);
      //기존 사용자일지라도, 현재 클라이언트가 접속한 소켓 ID(socket.id)를 userSockets 맵에 다시 매핑
      //-> 서버는 이 사용자의 최신 소켓 연결 정보를 알 수 있어서 서버가 사용자에게 실시간 메시지 보내기 가능

      console.log(`기존 사용자 등록: ${walletAddr} (${nickname}) -> ${socket.id}`);
      //기존 사용자가 등록됨, 어떤 소켓 ID와 연결됐는지

      // 기존 사용자임을 클라이언트에 알림 
      //(클라이언트는 이 신호를 받으면 승인 절차 없이 바로 다음 화면(page2 등)으로 이동)
      socket.emit('existingUserConfirmed', { walletAddr: normalizedWallet, nickname });
      return;
    }

    // 3) 신규사용자이면 소켓ID 매핑 후 승인 및 검증자 투표 진행 로직 수행
    userSockets.set(normalizedWallet, socket.id);
    console.log(`신규 사용자 등록: ${walletAddr} (${nickname}) -> ${socket.id}`);
    //userSockets : 사용자의 지갑주소를 키(key)로, 연결된 소켓 ID를 값(value)으로 저장하는 Map 컬렉션

    // 신규 사용자 승인 절차 시작 이벤트 등 처리 (예: 검증자 투표 요청)
    // ...(별도 로직 구현(투표 참여자에게 요청 보내고, 상태 관리 등), 근데 여기는 일단 server.js 다 보고나서 하자)
    //투표 승인 자체 판단, DB 업데이트, 최종 승인 통보 등은 별도 API에서 처리
  });

  // 소켓 연결 종료 시 매핑 삭제
  //현재 연결이 끊어진 소켓 ID(socket.id)를 찾아서 userSockets 맵에서 해당 사용자의 지갑주소-소켓ID 매핑을 삭제
  //이걸 해야 끊어진 클라이언트에 대한 오래된 소켓 정보가 남아 있지 않고, 메모리 관리 및 연결 대상 선택이 정확해짐
  socket.on('disconnect', () => {
    for (const [wallet, id] of userSockets.entries()) {
      if (id === socket.id) {
        userSockets.delete(wallet);
        console.log(`사용자 연결 해제: ${wallet} -> ${socket.id}`);
        break;
      }
    }
  });
});


  // 신규 사용자 입장 요청 처리
  socket.on('requestEntry', async ({ wallet, nickname }) => {
    const candidate = wallet.toLowerCase();
    if (pendingVerifications[candidate]) return; // 중복 요청 방지
    //pendingVerifications : 현재 승인 대기 중인 후보자 정보를 저장하는 객체

    try {
      // 인증점수 최신화
      await calcConfirmScores();

      // 인증점수 기반 검증자 선발
      validators = selectVerifiers();
      //Confirm.js > selectVerifiers()

      //없어도 될 것 같긴 한데 나중에 쓰일 지도 모르니까 살려둠
    //   if (validators.length === 0) {
    //     socket.emit('verificationCompleted', {
    //       candidate,
    //       approved: false,
    //       reason: '검증자 부족',
    //     });
    //     return;
    //   }

      // 입장 투표 상태 초기화
      //pendingVerifications : 승인 대기 중인 사용자들의 투표 상태를 저장하는 객체
      //키(candidate) : 신규 사용자의 지갑 주소(후보자 ID)
      //-> 키를 통해 해당 후보자의 투표 정보를 저장하는 객체를 새로 만듦
      pendingVerifications[candidate] = {
        validators: validators.map(v => v.id), //검증자들의 ID 배열을 저장
        votes: {}, //찬반 투표 결과를 저장할 빈 객체. { validatorId: true/false } 형태로 기록
        nickname, //신규 사용자의 닉네임을 저장, 투표 진행시 전달, 결과 판단
        link: '', //신규 사용자 프로필 링크 등 추가 정보를 저장할 공간
      };

      // 검증자 전원에게 승인 요청 이벤트 전달
      for (const vAddr of pendingVerifications[candidate].validators) { //검증자들의 지갑 주소 목록 순회
        const vSocketId = validatorSockets.get(vAddr.toLowerCase());
        //해당 검증자 지갑 주소로 서버에 저장된 소켓 ID(validatorSockets Map)를 조회
        if (vSocketId) { //검증자가 현재 온라인이며 소켓 ID가 존재할 때만 이벤트 전송 수행
          io.to(vSocketId).emit('verificationRequested', {
            candidate,
            nickname,
            message: `${nickname}(${candidate}) 님이 신규 입장 요청을 하였습니다.`, 
            //추후에 링크, 미리보기도 추가
            validators: pendingVerifications[candidate].validators,
          });
        }
      }

      console.log(`입장 요청: ${candidate}, 닉네임: ${nickname}, 검증자: ${pendingVerifications[candidate].validators.join(', ')}`);

    } catch (err) {
      console.error('requestEntry 처리 중 에러:', err);
    }
  });

  // 검증자 투표 처리
  socket.on('vote', ({ candidate, verifier, approve }) => {
  //vote 이벤트 : (in 웹소켓 이용 실시간 통신) 클라이언트(검증자)가 투표 결과를 서버에 전달하는 신호(이벤트 이름)
    candidate = candidate.toLowerCase();
    verifier = verifier.toLowerCase();
    //문자열 비교를 위해 소문자로 통일

    if (pendingVerifications[candidate].votes[verifier] !== undefined) return;
    //이미 이 검증자가 해당 후보자에 대해 투표한 적이 있는지 확인, 
    //votes 객체에 verifier 키가 존재하면, 이 검증자는 중복으로 투표 -> 종료

    pendingVerifications[candidate].votes[verifier] = !!approve;
    //검증자(verifier)가 해당 후보자(candidate)에 대해 찬성 여부(approve)를 투표 결과로 저장하는 부분
    //pendingVerifications : 현재 승인 대기 중인 후보자의 투표 상태를 저장하는 객체
    //!!approve : approve 값을 불리언 타입으로 확실히 변환하는 과정
    //ex) approve가 true면 true로, false나 undefined면 false로 저장됨

    const totalVotes = Object.keys(pendingVerifications[candidate].votes).length;
    //투표 결과 객체의 모든 키(투표한 검증자 ID들)를 배열로 반환
    //.length -> 지금까지 투표에 참여한 검증자의 수, 즉 투표된 총 개수 구하기
    const totalValidators = pendingVerifications[candidate].validators.length;
    //.length -> 예정된 검증자 전체 수, 즉 총 투표 대상자 수

    if (totalVotes === totalValidators) {
      // 투표 완료 시 최종 처리 함수 호출
      finalizeVerification(candidate);
    }
  });

  // 연결 종료 시 맵에서 소켓 제거
  socket.on('disconnect', () => {
    for (const [wallet, id] of userSockets.entries()) {
      if (id === socket.id) userSockets.delete(wallet);
    } //userSockets 맵에서 현재 끊어진 소켓 ID와 매칭되는 지갑 주소를 찾아 삭제
    for (const [validator, id] of validatorSockets.entries()) {
      if (id === socket.id) validatorSockets.delete(validator);
    }
  }); //validatorSockets 맵에서도 해당 소켓 ID의 검증자 지갑 주소를 찾아 삭제


// 투표 최종 결과 처리 함수
function finalizeVerification(candidate) {
  const data = pendingVerifications[candidate];
  if (!data) return;

  const approvals = Object.values(data.votes).filter(v => v).length; //.length : 찬성 투표 수 셈
  //data.votes 객체에서 모든 투표 값(true 또는 false)을 배열로 가져옴
  //filter(v => v) : 찬성(true)인 투표만 필터링해서 배열을 만듦
  const total = data.validators.length; //투표에 참여한 총 검증자 수
  const approved = approvals * 3 >= total * 2; // 2/3 이상 찬성 시 승인

  // **여기서 API 요청 전송으로 판단 또는 직접 저장도 가능**
  // 예를 들어, API 호출로 승인/거절 결과 전송 후 대응

  // 간단히 여기서는 소켓 통신으로 클라이언트 알림만 처리
  if (approved) {
    console.log(`✅ ${candidate} 승인 (${approvals}/${total})`);
  } else {
    console.log(`❌ ${candidate} 거절 (${approvals}/${total})`);
  } //최종 승인(approved가 참)이면 서버 콘솔에 "승인" 로그를 출력하고, 거절이면 "거절" 로그를 출력

  //data.validators 배열에 있는 모든 검증자 지갑 주소에 대해
  //검증자가 온라인 상태(validatorSockets에서 소켓 ID 조회)
  //-> 각 검증자에게 "verificationResult" 이벤트로 동일한 승인 결과를 전송
  const socketId = userSockets.get(candidate);
  if (socketId) {
    io.to(socketId).emit('verificationCompleted', { candidate, approved });
  }
  data.validators.forEach(v => {
    const vId = validatorSockets.get(v.toLowerCase());
    if (vId) io.to(vId).emit('verificationResult', { candidate, approved });
  });

  // 대기 목록에서 삭제
  delete pendingVerifications[candidate];
}

// 정적 파일 서비스 (예: public/index.html)
app.use(express.static('public'));

server.listen(3000, () => {
  console.log('서버 실행: http://localhost:3000');
});
