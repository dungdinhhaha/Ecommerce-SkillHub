import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import moment from "moment";

import "./Messages.scss";
import request from "../../utils/request.utils";

const Messages = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id }) => request.patch(`/conversation/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => request.get("/conversation").then((res) => res.data.data),
    refetchInterval: 5000,
  });
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  const handleRead = (id) => {
    mutation.mutate({ id });
  };

  return (
    <div className="messages">
      <div className="container">
        <div className="title">
          <h1>Tin nhắn</h1>
        </div>
        <table>
          <tbody>
            <tr>
              <th>{currentUser.isSeller ? "Buyer" : "Seller"}</th>
              <th>Sản phẩm</th>
              <th>Tin nhắn cuối</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
            {!isLoading && data.length > 0 ? (
              data.map((conversation) => (
                <tr
                  className={
                    (currentUser.isSeller && !conversation.readBySeller) ||
                    (!currentUser.isSeller && !conversation.readByBuyer)
                      ? `active`
                      : ``
                  }
                  key={conversation.id}
                >
                  <td>
                    {currentUser.isSeller
                      ? conversation.buyerId.username
                      : conversation.sellerId.username}
                  </td>

                  <td>
                    <Link to={`/message/${conversation.id}`} className="link conversation-product">
                      {conversation.gigId?.cover && <img src={conversation.gigId.cover} alt="" />}
                      <span>{conversation.gigId?.title || "Chưa gắn sản phẩm"}</span>
                    </Link>
                  </td>

                  <td>
                    <Link to={`/message/${conversation.id}`} className="link">
                      {(conversation.lastMessage || "Chưa có tin nhắn").substring(0, 100)}...
                    </Link>
                  </td>
                  <td>{moment(conversation.updatedAt).fromNow()}</td>
                  <td>
                    {(currentUser.isSeller && !conversation.readBySeller) ||
                    (!currentUser.isSeller && !conversation.readByBuyer) ? (
                      <button onClick={() => handleRead(conversation.id)}>
                        Đánh dấu đã đọc
                      </button>
                    ) : (
                      <Link to={`/message/${conversation.id}`} className="link">
                        <button>Xem</button>
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <div className="no-msg">Chưa có tin nhắn</div>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Messages;
