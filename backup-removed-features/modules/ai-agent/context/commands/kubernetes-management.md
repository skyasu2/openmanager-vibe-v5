# ☸️ 쿠버네티스 관리 명령어 가이드

> **분류**: 핵심 컨텍스트 (실무 필수)  
> **우선순위**: 높음  
> **역할**: 쿠버네티스 클러스터 운영 및 트러블슈팅

## 🚨 Pod 문제 해결

### CrashLoopBackOff 진단

```bash
# Pod 상세 정보 확인
kubectl describe pod [pod-name] -n [namespace]

# 현재 컨테이너 로그
kubectl logs [pod-name] -n [namespace]

# 이전 컨테이너 로그 (재시작된 경우)
kubectl logs [pod-name] --previous -n [namespace]

# 클러스터 이벤트 확인
kubectl get events --sort-by='.lastTimestamp' -n [namespace]

# Pod YAML 확인
kubectl get pod [pod-name] -o yaml -n [namespace]
```

### Pod 복구 명령어

```bash
# Pod 재시작 (Deployment의 경우)
kubectl rollout restart deployment [deployment-name] -n [namespace]

# Pod 강제 삭제 후 재생성
kubectl delete pod [pod-name] --force --grace-period=0 -n [namespace]

# Deployment 스케일 조정
kubectl scale deployment [deployment-name] --replicas=0 -n [namespace]
kubectl scale deployment [deployment-name] --replicas=3 -n [namespace]
```

### ⚠️ 안전성 경고

- Pod 삭제 시 서비스 중단 가능성 확인
- `--force` 옵션은 응급상황에만 사용
- 프로덕션에서는 Deployment 통해 관리

---

## 🖥️ 노드 관리

### 노드 상태 진단

```bash
# 모든 노드 상태 확인
kubectl get nodes -o wide

# 특정 노드 상세 정보
kubectl describe node [node-name]

# 노드 리소스 사용량
kubectl top nodes

# 노드별 Pod 배치 현황
kubectl get pods --all-namespaces -o wide --field-selector spec.nodeName=[node-name]
```

### 노드 유지보수

```bash
# 노드에서 Pod 제거 (유지보수 모드)
kubectl drain [node-name] --ignore-daemonsets --delete-emptydir-data

# 노드 스케줄링 중단 (Pod 이동 없음)
kubectl cordon [node-name]

# 노드 스케줄링 재개
kubectl uncordon [node-name]

# 노드 라벨 관리
kubectl label nodes [node-name] key=value
kubectl label nodes [node-name] key-
```

### ⚠️ 안전성 경고

- `drain` 실행 시 Pod 이동으로 서비스 영향
- DaemonSet Pod는 별도 처리 필요
- 노드 작업 전 워크로드 분산 확인

---

## 🌐 서비스 및 네트워킹

### 서비스 진단

```bash
# 서비스 목록 확인
kubectl get svc -n [namespace]

# 서비스 상세 정보
kubectl describe svc [service-name] -n [namespace]

# 엔드포인트 확인
kubectl get endpoints [service-name] -n [namespace]

# 서비스 연결 테스트
kubectl port-forward svc/[service-name] [local-port]:[service-port] -n [namespace]
```

### 네트워크 트러블슈팅

```bash
# Pod 내부 접근
kubectl exec -it [pod-name] -n [namespace] -- /bin/bash

# 네트워크 연결 테스트
kubectl exec -it [pod-name] -n [namespace] -- wget -qO- [url]
kubectl exec -it [pod-name] -n [namespace] -- nslookup [service-name]

# 인그레스 확인
kubectl get ingress -n [namespace]
kubectl describe ingress [ingress-name] -n [namespace]

# 네트워크 정책 확인
kubectl get networkpolicy -n [namespace]
```

### ⚠️ 안전성 경고

- `port-forward` 사용 시 보안 고려
- `exec` 명령어로 변경한 내용은 영구적이지 않음
- 네트워크 정책 변경 시 Pod 간 통신 차단 가능

---

## 📊 리소스 모니터링

### 리소스 사용량 확인

```bash
# Pod 리소스 사용량
kubectl top pods -n [namespace]

# 노드 리소스 사용량
kubectl top nodes

# 특정 Pod의 리소스 제한/요청
kubectl describe pod [pod-name] -n [namespace] | grep -A 5 "Limits\|Requests"

# 네임스페이스별 리소스 할당량
kubectl describe quota -n [namespace]
```

### 리소스 최적화

```bash
# Deployment 리소스 수정
kubectl edit deployment [deployment-name] -n [namespace]

# HPA (Horizontal Pod Autoscaler) 확인
kubectl get hpa -n [namespace]

# VPA (Vertical Pod Autoscaler) 확인
kubectl get vpa -n [namespace]

# 리소스 사용량 모니터링
kubectl get --watch pods -n [namespace]
```

### ⚠️ 안전성 경고

- 리소스 제한 변경 시 Pod 재시작 가능성
- `edit` 명령어 사용 시 실시간 변경 주의
- HPA 설정 변경 시 스케일링 동작 영향

---

## 🚀 배포 관리

### 배포 상태 관리

```bash
# 배포 적용
kubectl apply -f [yaml-file]

# 배포 상태 확인
kubectl rollout status deployment/[deployment-name] -n [namespace]

# 배포 히스토리
kubectl rollout history deployment/[deployment-name] -n [namespace]

# 이전 버전으로 롤백
kubectl rollout undo deployment/[deployment-name] -n [namespace]

# 특정 리비전으로 롤백
kubectl rollout undo deployment/[deployment-name] --to-revision=[revision] -n [namespace]
```

### 스케일링 관리

```bash
# 수동 스케일링
kubectl scale deployment [deployment-name] --replicas=[number] -n [namespace]

# 오토스케일러 설정
kubectl autoscale deployment [deployment-name] --min=2 --max=10 --cpu-percent=80 -n [namespace]

# ReplicaSet 확인
kubectl get rs -n [namespace]
```

### ⚠️ 안전성 경고

- `apply` 전 YAML 파일 검증 필수
- 롤백 시 데이터 일관성 확인
- 스케일링 시 리소스 용량 고려

---

## 🔧 설정 관리

### ConfigMap 관리

```bash
# ConfigMap 목록
kubectl get configmap -n [namespace]

# ConfigMap 상세 정보
kubectl describe configmap [configmap-name] -n [namespace]

# ConfigMap 생성
kubectl create configmap [name] --from-file=[file] -n [namespace]

# ConfigMap 수정
kubectl edit configmap [configmap-name] -n [namespace]
```

### Secret 관리

```bash
# Secret 목록
kubectl get secrets -n [namespace]

# Secret 상세 정보 (값 숨김)
kubectl describe secret [secret-name] -n [namespace]

# Secret 생성
kubectl create secret generic [name] --from-literal=key=value -n [namespace]

# Secret 값 확인 (Base64 디코딩)
kubectl get secret [secret-name] -o jsonpath='{.data.key}' -n [namespace] | base64 -d
```

### ⚠️ 안전성 경고

- Secret 정보 노출 주의
- ConfigMap 변경 시 Pod 재시작 필요할 수 있음
- 민감 정보는 반드시 Secret 사용

---

## 💾 스토리지 관리

### 볼륨 관리

```bash
# PersistentVolume 확인
kubectl get pv

# PersistentVolumeClaim 확인
kubectl get pvc -n [namespace]

# 볼륨 상세 정보
kubectl describe pv [pv-name]
kubectl describe pvc [pvc-name] -n [namespace]

# 스토리지 클래스 확인
kubectl get storageclass
```

### ⚠️ 안전성 경고

- PVC 삭제 시 데이터 손실 위험
- PV 정책(Retain/Delete)에 따른 데이터 보존 확인
- 스토리지 클래스 변경 시 기존 볼륨 영향

---

## 🔍 디버깅 및 로그

### 종합 디버깅

```bash
# 클러스터 전체 상태
kubectl cluster-info

# API 서버 상태
kubectl get componentstatuses

# 모든 리소스 확인
kubectl get all -n [namespace]

# 특정 리소스 YAML 출력
kubectl get [resource] [name] -o yaml -n [namespace]

# 리소스 변경 사항 모니터링
kubectl get pods --watch -n [namespace]
```

### 로그 수집

```bash
# 여러 Pod 로그 동시 확인
kubectl logs -l app=[app-name] -n [namespace]

# 로그 스트리밍
kubectl logs -f [pod-name] -n [namespace]

# 멀티 컨테이너 Pod의 특정 컨테이너 로그
kubectl logs [pod-name] -c [container-name] -n [namespace]

# 이벤트 로그
kubectl get events --sort-by='.lastTimestamp' -n [namespace]
```

---

## 🚨 응급 상황 대응

### Pod 응급 복구

1. `kubectl get pods -n [namespace]` - 문제 Pod 식별
2. `kubectl describe pod [pod-name] -n [namespace]` - 상세 정보 확인
3. `kubectl logs [pod-name] --previous -n [namespace]` - 로그 분석
4. `kubectl delete pod [pod-name] -n [namespace]` - Pod 재생성
5. `kubectl get events -n [namespace]` - 이벤트 확인

### 서비스 불통 응급 대응

1. `kubectl get svc -n [namespace]` - 서비스 상태 확인
2. `kubectl get endpoints -n [namespace]` - 엔드포인트 확인
3. `kubectl get pods -l app=[app] -n [namespace]` - 백엔드 Pod 확인
4. `kubectl port-forward` - 직접 연결 테스트
5. `kubectl rollout restart deployment/[name] -n [namespace]` - 서비스 재시작

### 노드 장애 대응

1. `kubectl get nodes` - 노드 상태 확인
2. `kubectl describe node [node]` - 노드 상세 정보
3. `kubectl drain [node] --ignore-daemonsets` - Pod 대피
4. 노드 수리 또는 교체
5. `kubectl uncordon [node]` - 노드 복구

---

**💡 핵심 원칙**

- 네임스페이스 지정 습관화 (`-n [namespace]`)
- 변경 전 현재 상태 백업 (`kubectl get -o yaml`)
- 점진적 배포로 위험 최소화
- 모니터링과 로그를 통한 사전 예방
