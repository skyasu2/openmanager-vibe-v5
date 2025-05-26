# 서버 관리 명령어

## 시스템 정보
- `uname -a`: 시스템 정보
- `lscpu`: CPU 정보
- `lsmem`: 메모리 정보
- `lsblk`: 블록 디바이스 정보

## 프로세스 관리
- `ps aux`: 실행 중인 프로세스
- `kill -9 <PID>`: 프로세스 강제 종료
- `systemctl status <service>`: 서비스 상태
- `systemctl restart <service>`: 서비스 재시작

## 로그 확인
- `tail -f /var/log/syslog`: 시스템 로그 실시간 확인
- `journalctl -u <service>`: 특정 서비스 로그
- `dmesg`: 커널 메시지

## 네트워크
- `ping <host>`: 연결 테스트
- `wget <url>`: 파일 다운로드
- `curl -I <url>`: HTTP 헤더 확인
