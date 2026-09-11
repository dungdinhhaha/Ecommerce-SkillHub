import React, { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import request from "../../utils/request.utils";
import socket from "../../utils/socket.utils";
import "./Message.scss";

const Message = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const mutation = useMutation({
    mutationFn: (data) =>
      request
        .post(`/conversation/${data.convesationId}/messages`, data)
        .then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["messages"],
    queryFn: () =>
      request.get(`/conversation/${id}/messages`).then((res) => res.data.data),
  });
  const { data: conversation } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => request.get(`/conversation/${id}`).then((res) => res.data.data),
  });

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit("join_conversation", id);
    const onMessage = (message) => {
      queryClient.setQueryData(["messages"], (old = []) => {
        if (old.some((item) => item._id === message._id)) return old;
        return [...old, message];
      });
    };
    socket.on("message:new", onMessage);
    return () => {
      socket.emit("leave_conversation", id);
      socket.off("message:new", onMessage);
    };
  }, [id, queryClient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const desc = e.target[0].value;
    if (!desc.trim()) return;
    mutation.mutate({ desc, conversationId: id });
    e.target[0].value = "";
  };
  const handleOrderFromChat = () => {
    if (!conversation?.gigId?._id) return;
    if (currentUser?.isSeller || currentUser?.isAdmin) {
      navigate(`/gig/${conversation.gigId._id}`);
      return;
    }
    navigate(`/pay/${conversation.gigId._id}`);
  };

  if (isLoading) return <div style={{ textAlign: "center" }}>Loading...</div>;
  if (isError) return <div style={{ textAlign: "center" }}>Error</div>;

  return (
    <div className="message">
      <div className="container">
        <span className="breadcrumbs">
          <Link to="/messages" className="link">
            Tin nhắn
          </Link>
          &gt; {id}
        </span>
        {conversation?.gigId && (
          <section className="chat-gig-card">
            <Link to={`/gig/${conversation.gigId._id}`}>
              <img src={conversation.gigId.cover || "/img/demo.png"} alt={conversation.gigId.title} />
            </Link>
            <div>
              <span>{conversation.gigId.listingType === "digital_product" ? "Sản phẩm số" : "Dịch vụ kỹ năng"}</span>
              <Link to={`/gig/${conversation.gigId._id}`} className="link"><h2>{conversation.gigId.title}</h2></Link>
              <p>{conversation.gigId.shortDesc}</p>
            </div>
            <button onClick={handleOrderFromChat}>{currentUser?.isSeller || currentUser?.isAdmin ? "Xem sản phẩm" : "Mua ngay"}</button>
          </section>
        )}
        <div className="messages">
          {data && data.length > 0 ? (
            data.map((msg) => (
              <div
                key={msg._id}
                className={`item ${
                  msg.senderId._id == currentUser._id ? "owner" : ""
                }`}
              >
                <img
                  src={
                    msg.senderId._id == currentUser._id
                      ? currentUser.img || "/img/noavatar.png"
                      : msg.senderId.img || "/img/noavatar.png"
                  }
                  alt=""
                />
                <p>{msg.desc}</p>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center" }}>No messages</div>
          )}
        </div>
        <hr />
        <form className="write" onSubmit={handleSubmit}>
          <textarea
            name=""
            placeholder="Nhập tin nhắn..."
            id=""
            cols="30"
            rows="10"
          ></textarea>
          <button type="submit">Gửi</button>
        </form>
      </div>
    </div>
  );
};

export default Message;
